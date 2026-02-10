'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConflictInfo, ConflictLocation, ConflictResolution, Line } from '../types';

interface ConflictContextType {
    conflicts: ConflictInfo[];
    scanForConflicts: (lines: Line[]) => void;
    resolveConflict: (conflictId: string, resolution: ConflictResolution, preferredForm?: 'formA' | 'formB') => Line[];
    getConflictsForLine: (lineIndex: number) => ConflictInfo[];
    getConflictsForSegment: (lineIndex: number, segmentIndex: number) => ConflictInfo[];
    clearConflicts: () => void;
    activeConflict: ConflictInfo | null;
    setActiveConflict: (conflict: ConflictInfo | null) => void;
}

const ConflictContext = createContext<ConflictContextType | undefined>(undefined);

/**
 * Build a map of word → segmentation forms across all lines
 * Detects when the same sequence of characters is segmented differently
 */
function findInconsistencies(lines: Line[]): ConflictInfo[] {
    // Map: joined text → { segForms: Map<segForm, locations> }
    const wordMap = new Map<
        string,
        Map<string, ConflictLocation[]>
    >();

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const segs = line.segments;

        // Check all 2-segment, 3-segment, and 4-segment windows
        for (let windowSize = 2; windowSize <= Math.min(4, segs.length); windowSize++) {
            for (let i = 0; i <= segs.length - windowSize; i++) {
                const windowSegs = segs.slice(i, i + windowSize);
                const joinedText = windowSegs.map(s => s.text).join('');
                const segForm = windowSegs.map(s => s.text).join('|');

                // Build context string
                const ctxStart = Math.max(0, i - 1);
                const ctxEnd = Math.min(segs.length, i + windowSize + 1);
                const context = segs.slice(ctxStart, ctxEnd).map(s => s.text).join(' ');

                if (!wordMap.has(joinedText)) {
                    wordMap.set(joinedText, new Map());
                }
                const formMap = wordMap.get(joinedText)!;
                if (!formMap.has(segForm)) {
                    formMap.set(segForm, []);
                }
                formMap.get(segForm)!.push({
                    lineId: line.id,
                    lineIndex: lineIdx,
                    segmentIndices: Array.from({ length: windowSize }, (_, k) => i + k),
                    context,
                });
            }
        }

        // Also check single segments that may match multi-segment joined forms
        for (let i = 0; i < segs.length; i++) {
            const singleText = segs[i].text;
            if (wordMap.has(singleText)) {
                const formMap = wordMap.get(singleText)!;
                const singleForm = singleText; // single segment = no pipe
                if (!formMap.has(singleForm)) {
                    formMap.set(singleForm, []);
                }
                // Avoid duplicate entries
                const existing = formMap.get(singleForm)!;
                const alreadyExists = existing.some(
                    loc => loc.lineIndex === lineIdx && loc.segmentIndices[0] === i
                );
                if (!alreadyExists) {
                    const ctxStart = Math.max(0, i - 1);
                    const ctxEnd = Math.min(segs.length, i + 2);
                    const context = segs.slice(ctxStart, ctxEnd).map(s => s.text).join(' ');

                    existing.push({
                        lineId: line.id,
                        lineIndex: lineIdx,
                        segmentIndices: [i],
                        context,
                    });
                }
            }
        }
    }

    // Identify conflicts: words with more than one segmentation form
    const conflicts: ConflictInfo[] = [];
    let conflictId = 0;

    for (const [word, formMap] of wordMap.entries()) {
        if (formMap.size > 1) {
            const forms = Array.from(formMap.entries());
            // Take first two forms as formA and formB
            const [formAKey, locsA] = forms[0];
            const [formBKey, locsB] = forms[1];

            conflicts.push({
                id: `conflict-${conflictId++}`,
                word,
                formA: formAKey.split('|'),
                formB: formBKey.split('|'),
                locationsA: locsA,
                locationsB: locsB,
                type: 'inconsistent_segmentation',
                resolved: false,
            });
        }
    }

    return conflicts;
}

export function ConflictProvider({ children }: { children: ReactNode }) {
    const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
    const [activeConflict, setActiveConflict] = useState<ConflictInfo | null>(null);
    const [linesRef, setLinesRef] = useState<Line[]>([]);

    const scanForConflicts = useCallback((lines: Line[]) => {
        setLinesRef(lines);
        const detected = findInconsistencies(lines);
        setConflicts(detected);
    }, []);

    const resolveConflict = useCallback((conflictId: string, resolution: ConflictResolution, preferredForm?: 'formA' | 'formB'): Line[] => {
        const conflict = conflicts.find(c => c.id === conflictId);
        if (!conflict) return linesRef;

        let updatedLines = [...linesRef];

        if (resolution === 'fix_all') {
            // Determine which form to apply and which to replace
            const applyFormA = preferredForm === 'formA';
            const locationsToChange = applyFormA ? conflict.locationsB : conflict.locationsA;
            const formToApply = applyFormA ? conflict.formA : conflict.formB;

            console.log(`Fix All: Applying Form ${preferredForm?.toUpperCase()}, replacing ${locationsToChange.length} instances`);

            // Replace all instances of the non-preferred form
            // IMPORTANT: Group by lineIndex and process in REVERSE order (right → left)
            // so that earlier splice operations don't shift indices for later ones.

            // Group locations by line index
            const locsByLine = new Map<number, typeof locationsToChange>();
            for (const loc of locationsToChange) {
                const arr = locsByLine.get(loc.lineIndex) || [];
                arr.push(loc);
                locsByLine.set(loc.lineIndex, arr);
            }

            for (const [lineIndex, locs] of locsByLine.entries()) {
                // Sort DESCENDING by start segment index — process from right to left
                const sortedLocs = [...locs].sort((a, b) => b.segmentIndices[0] - a.segmentIndices[0]);

                const line = { ...updatedLines[lineIndex] };
                const newSegments = [...line.segments];

                for (const loc of sortedLocs) {
                    const startIdx = loc.segmentIndices[0];
                    const removeCount = loc.segmentIndices.length;

                    // Safety check: verify the segments we're about to replace actually match
                    const currentText = newSegments.slice(startIdx, startIdx + removeCount).map(s => s.text).join('');
                    const expectedText = conflict.word;
                    if (currentText !== expectedText) {
                        console.warn(`⚠️ Skipping splice at line ${lineIndex} idx ${startIdx}: expected "${expectedText}" but found "${currentText}"`);
                        continue;
                    }

                    newSegments.splice(
                        startIdx,
                        removeCount,
                        ...formToApply.map((text, idx) => ({
                            id: `resolved-${conflictId}-${lineIndex}-${startIdx}-${idx}-${Date.now()}`,
                            text,
                            isActive: false,
                            hasConflict: false,
                        }))
                    );
                }

                line.segments = newSegments;
                updatedLines[lineIndex] = line;
            }
        } else if (resolution === 'exception') {
            // Keep both forms — just mark as resolved
        }
        // 'ignore' — do nothing

        // Mark conflict as resolved
        setConflicts(prev =>
            prev.map(c =>
                c.id === conflictId
                    ? { ...c, resolved: true, resolution }
                    : c
            )
        );

        setActiveConflict(null);
        return updatedLines;
    }, [conflicts, linesRef]);

    const getConflictsForLine = useCallback((lineIndex: number): ConflictInfo[] => {
        return conflicts.filter(c =>
            !c.resolved && (
                c.locationsA.some(loc => loc.lineIndex === lineIndex) ||
                c.locationsB.some(loc => loc.lineIndex === lineIndex)
            )
        );
    }, [conflicts]);

    const getConflictsForSegment = useCallback((lineIndex: number, segmentIndex: number): ConflictInfo[] => {
        return conflicts.filter(c =>
            !c.resolved && (
                c.locationsA.some(loc =>
                    loc.lineIndex === lineIndex && loc.segmentIndices.includes(segmentIndex)
                ) ||
                c.locationsB.some(loc =>
                    loc.lineIndex === lineIndex && loc.segmentIndices.includes(segmentIndex)
                )
            )
        );
    }, [conflicts]);

    const clearConflicts = useCallback(() => {
        setConflicts([]);
        setActiveConflict(null);
    }, []);

    return (
        <ConflictContext.Provider
            value={{
                conflicts,
                scanForConflicts,
                resolveConflict,
                getConflictsForLine,
                getConflictsForSegment,
                clearConflicts,
                activeConflict,
                setActiveConflict,
            }}
        >
            {children}
        </ConflictContext.Provider>
    );
}

export function useConflicts() {
    const context = useContext(ConflictContext);
    if (!context) {
        throw new Error('useConflicts must be used within a ConflictProvider');
    }
    return context;
}
