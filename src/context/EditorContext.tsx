'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { Line, Segment, EditorMode, ViewMode, UndoEntry, ProjectData, ProjectMeta } from '../types';
import { segmentIntoSyllables, splitIntoLines, resegment, isUnderSegmented } from '../lib/sylbreak';

const STORAGE_KEY = 'myan-seg-editor';
const MAX_UNDO_HISTORY = 50;

interface EditorContextType {
    lines: Line[];
    currentLineIndex: number;
    currentSegmentIndex: number;
    mode: EditorMode;
    viewMode: ViewMode;
    hasUnsavedChanges: boolean;
    showConfidenceColors: boolean;
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    importText: (text: string) => void;
    splitSegment: (lineIndex: number, segmentIndex: number, position: number) => void;
    mergeSegments: (lineIndex: number, segmentIndex: number) => void;
    editSegment: (lineIndex: number, segmentIndex: number, newText: string) => void;
    setActiveSegment: (lineIndex: number, segmentIndex: number) => void;
    setMode: (mode: EditorMode) => void;
    setViewMode: (mode: ViewMode) => void;
    toggleConfidenceColors: () => void;
    navigateLeft: () => void;
    navigateRight: () => void;
    navigateUp: () => void;
    navigateDown: () => void;
    undo: () => void;
    redo: () => void;
    save: () => void;
    exportData: () => ProjectData;
    clearAll: () => void;
    markLineReviewed: (lineIndex: number) => void;
    setLines: (lines: Line[]) => void;
    getSegmentedWord: () => string; // Get the word at current cursor for dictionary lookup
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [lines, setLinesState] = useState<Line[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [mode, setMode] = useState<EditorMode>('segmentation');
    const [viewMode, setViewMode] = useState<ViewMode>('line');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfidenceColors, setShowConfidenceColors] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Undo/Redo stacks
    const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
    const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);

    const segmentIdCounter = useRef(0);

    // Load from localStorage on mount (supports both legacy full format and compact format)
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                // Compact format (new)
                if (data.compactLines && data.compactLines.length > 0) {
                    const restoredLines: Line[] = data.compactLines.map((cl: { id: number; originalText: string; status: string; segTexts: string[] }) => ({
                        id: cl.id,
                        originalText: cl.originalText,
                        status: cl.status as Line['status'],
                        segments: cl.segTexts.map((text: string, idx: number) => ({
                            id: `line-${cl.id}-seg-${idx}-restored`,
                            text,
                            isActive: false,
                        })),
                    }));
                    setLinesState(restoredLines);
                } else if (data.lines && data.lines.length > 0) {
                    // Legacy full format
                    setLinesState(data.lines);
                }
                setCurrentLineIndex(data.currentLineIndex || 0);
                setCurrentSegmentIndex(data.currentSegmentIndex || 0);
                setViewMode(data.viewMode || 'line');
                setShowConfidenceColors(data.showConfidenceColors ?? true);
                segmentIdCounter.current = data.segmentIdCounter || 0;
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    // Auto-save to localStorage on change (debounced, compact format)
    useEffect(() => {
        if (!mounted || lines.length === 0) return;
        const timer = setTimeout(() => {
            try {
                // Store compact representation: only segment texts + line status
                const compactLines = lines.map(line => ({
                    id: line.id,
                    originalText: line.originalText,
                    status: line.status,
                    segTexts: line.segments.map(s => s.text),
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    compactLines,
                    currentLineIndex,
                    currentSegmentIndex,
                    viewMode,
                    showConfidenceColors,
                    segmentIdCounter: segmentIdCounter.current,
                }));
            } catch {
                // Quota exceeded — silently skip; user can still export as JSON
                console.warn('localStorage quota exceeded, auto-save skipped');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [lines, currentLineIndex, currentSegmentIndex, viewMode, showConfidenceColors, mounted]);

    const generateSegmentId = useCallback((lineId: number, index: number): string => {
        segmentIdCounter.current += 1;
        return `line-${lineId}-seg-${index}-${segmentIdCounter.current}`;
    }, []);

    // Push current state to undo stack
    const pushUndo = useCallback((description: string) => {
        setUndoStack(prev => {
            const entry: UndoEntry = {
                lines: JSON.parse(JSON.stringify(lines)),
                description,
                timestamp: Date.now(),
            };
            const newStack = [...prev, entry];
            if (newStack.length > MAX_UNDO_HISTORY) {
                newStack.shift();
            }
            return newStack;
        });
        setRedoStack([]); // Clear redo on new action
    }, [lines]);

    // Wrapper that also adds under-segmentation warnings
    const addWarnings = useCallback((segs: Segment[]): Segment[] => {
        return segs.map(seg => ({
            ...seg,
            warnings: isUnderSegmented(seg.text) ? ['under_segmentation' as const] : [],
        }));
    }, []);

    const importText = useCallback((text: string) => {
        const textLines = splitIntoLines(text);
        const newLines: Line[] = textLines.map((lineText, index) => {
            const syllables = segmentIntoSyllables(lineText);
            const segments: Segment[] = addWarnings(
                syllables.map((syllable, segIndex) => ({
                    id: generateSegmentId(index + 1, segIndex),
                    text: syllable,
                    isActive: index === 0 && segIndex === 0,
                    hasConflict: false,
                }))
            );

            return {
                id: index + 1,
                originalText: lineText,
                segments,
                status: 'pending' as const,
            };
        });

        setLinesState(newLines);
        setCurrentLineIndex(0);
        setCurrentSegmentIndex(0);
        setHasUnsavedChanges(true);
        setUndoStack([]);
        setRedoStack([]);
    }, [generateSegmentId, addWarnings]);

    const splitSegment = useCallback((lineIndex: number, segmentIndex: number, position: number) => {
        pushUndo(`Split segment on line ${lineIndex + 1}`);

        setLinesState(prevLines => {
            const newLines = [...prevLines];
            const line = newLines[lineIndex];
            const segment = line.segments[segmentIndex];

            if (position <= 0 || position >= segment.text.length) {
                return prevLines;
            }

            const leftText = segment.text.substring(0, position);
            const rightText = segment.text.substring(position);

            const newSegments = [...line.segments];
            newSegments[segmentIndex] = {
                ...segment,
                text: leftText,
                isActive: false,
                warnings: isUnderSegmented(leftText) ? ['under_segmentation'] : [],
            };
            newSegments.splice(segmentIndex + 1, 0, {
                id: generateSegmentId(line.id, segmentIndex + 1),
                text: rightText,
                isActive: true,
                warnings: isUnderSegmented(rightText) ? ['under_segmentation'] : [],
            });

            newLines[lineIndex] = {
                ...line,
                segments: newSegments,
                status: 'pending',
            };

            return newLines;
        });

        setCurrentSegmentIndex(prev => prev + 1);
        setHasUnsavedChanges(true);
    }, [generateSegmentId, pushUndo]);

    const mergeSegments = useCallback((lineIndex: number, segmentIndex: number) => {
        if (segmentIndex <= 0) return;

        pushUndo(`Merge segments on line ${lineIndex + 1}`);

        setLinesState(prevLines => {
            const newLines = [...prevLines];
            const line = newLines[lineIndex];
            const currentSegment = line.segments[segmentIndex];
            const previousSegment = line.segments[segmentIndex - 1];

            const mergedText = previousSegment.text + currentSegment.text;

            const newSegments = [...line.segments];
            newSegments[segmentIndex - 1] = {
                ...previousSegment,
                text: mergedText,
                isActive: true,
                warnings: isUnderSegmented(mergedText) ? ['under_segmentation'] : [],
            };
            newSegments.splice(segmentIndex, 1);

            newLines[lineIndex] = {
                ...line,
                segments: newSegments,
                status: 'pending',
            };

            return newLines;
        });

        setCurrentSegmentIndex(prev => Math.max(0, prev - 1));
        setHasUnsavedChanges(true);
    }, [pushUndo]);

    const editSegment = useCallback((lineIndex: number, segmentIndex: number, newText: string) => {
        pushUndo(`Edit segment on line ${lineIndex + 1}`);

        setLinesState(prevLines => {
            const newLines = [...prevLines];
            const line = newLines[lineIndex];
            const newSyllables = resegment(newText);
            const newSegments = [...line.segments];

            newSegments.splice(
                segmentIndex,
                1,
                ...addWarnings(
                    newSyllables.map((syllable, idx) => ({
                        id: generateSegmentId(line.id, segmentIndex + idx),
                        text: syllable,
                        isActive: idx === 0,
                    }))
                )
            );

            newLines[lineIndex] = {
                ...line,
                segments: newSegments,
                status: 'pending',
            };

            return newLines;
        });

        setHasUnsavedChanges(true);
    }, [generateSegmentId, pushUndo, addWarnings]);

    const setActiveSegment = useCallback((lineIndex: number, segmentIndex: number) => {
        setLinesState(prevLines => {
            return prevLines.map((line, lIdx) => ({
                ...line,
                segments: line.segments.map((seg, sIdx) => ({
                    ...seg,
                    isActive: lIdx === lineIndex && sIdx === segmentIndex,
                })),
            }));
        });
        setCurrentLineIndex(lineIndex);
        setCurrentSegmentIndex(segmentIndex);
    }, []);

    const navigateLeft = useCallback(() => {
        if (currentSegmentIndex > 0) {
            setActiveSegment(currentLineIndex, currentSegmentIndex - 1);
        } else if (currentLineIndex > 0) {
            const prevLine = lines[currentLineIndex - 1];
            setActiveSegment(currentLineIndex - 1, prevLine.segments.length - 1);
        }
    }, [currentLineIndex, currentSegmentIndex, lines, setActiveSegment]);

    const navigateRight = useCallback(() => {
        const currentLine = lines[currentLineIndex];
        if (!currentLine) return;

        if (currentSegmentIndex < currentLine.segments.length - 1) {
            setActiveSegment(currentLineIndex, currentSegmentIndex + 1);
        } else if (currentLineIndex < lines.length - 1) {
            setActiveSegment(currentLineIndex + 1, 0);
        }
    }, [currentLineIndex, currentSegmentIndex, lines, setActiveSegment]);

    const navigateUp = useCallback(() => {
        if (currentLineIndex > 0) {
            const prevLine = lines[currentLineIndex - 1];
            const segIdx = Math.min(currentSegmentIndex, prevLine.segments.length - 1);
            setActiveSegment(currentLineIndex - 1, segIdx);
        }
    }, [currentLineIndex, currentSegmentIndex, lines, setActiveSegment]);

    const navigateDown = useCallback(() => {
        if (currentLineIndex < lines.length - 1) {
            const nextLine = lines[currentLineIndex + 1];
            const segIdx = Math.min(currentSegmentIndex, nextLine.segments.length - 1);
            setActiveSegment(currentLineIndex + 1, segIdx);
        }
    }, [currentLineIndex, currentSegmentIndex, lines, setActiveSegment]);

    const undo = useCallback(() => {
        if (undoStack.length === 0) return;

        const lastEntry = undoStack[undoStack.length - 1];
        // Push current state to redo
        setRedoStack(prev => [...prev, {
            lines: JSON.parse(JSON.stringify(lines)),
            description: 'Redo',
            timestamp: Date.now(),
        }]);

        setUndoStack(prev => prev.slice(0, -1));
        setLinesState(lastEntry.lines);
        setHasUnsavedChanges(true);
    }, [undoStack, lines]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;

        const lastEntry = redoStack[redoStack.length - 1];
        // Push current state to undo
        setUndoStack(prev => [...prev, {
            lines: JSON.parse(JSON.stringify(lines)),
            description: 'Undo',
            timestamp: Date.now(),
        }]);

        setRedoStack(prev => prev.slice(0, -1));
        setLinesState(lastEntry.lines);
        setHasUnsavedChanges(true);
    }, [redoStack, lines]);

    const save = useCallback(() => {
        setHasUnsavedChanges(false);
        if (typeof window !== 'undefined') {
            try {
                const compactLines = lines.map(line => ({
                    id: line.id,
                    originalText: line.originalText,
                    status: line.status,
                    segTexts: line.segments.map(s => s.text),
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    compactLines,
                    currentLineIndex,
                    currentSegmentIndex,
                    viewMode,
                    showConfidenceColors,
                    segmentIdCounter: segmentIdCounter.current,
                }));
            } catch {
                console.warn('localStorage quota exceeded, save skipped — use Export instead');
            }
        }
    }, [lines, currentLineIndex, currentSegmentIndex, viewMode, showConfidenceColors]);

    const exportData = useCallback((): ProjectData => {
        const projectMeta: ProjectMeta = {
            name: 'Myanmar_Segmentation_Project',
            createdAt: new Date().toISOString().split('T')[0],
            totalLines: lines.length,
            lastModified: new Date().toISOString(),
        };

        return {
            projectMeta,
            content: lines,
        };
    }, [lines]);

    const clearAll = useCallback(() => {
        setLinesState([]);
        setCurrentLineIndex(0);
        setCurrentSegmentIndex(0);
        setHasUnsavedChanges(false);
        setUndoStack([]);
        setRedoStack([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const markLineReviewed = useCallback((lineIndex: number) => {
        pushUndo(`Mark line ${lineIndex + 1} as reviewed`);
        setLinesState(prevLines => {
            const newLines = [...prevLines];
            newLines[lineIndex] = {
                ...newLines[lineIndex],
                status: newLines[lineIndex].status === 'reviewed' ? 'pending' : 'reviewed',
            };
            return newLines;
        });
        setHasUnsavedChanges(true);
    }, [pushUndo]);

    const setLines = useCallback((newLines: Line[]) => {
        setLinesState(newLines);
        setHasUnsavedChanges(true);
    }, []);

    const toggleConfidenceColors = useCallback(() => {
        setShowConfidenceColors(prev => !prev);
    }, []);

    const getSegmentedWord = useCallback((): string => {
        if (lines.length === 0) return '';
        const line = lines[currentLineIndex];
        if (!line) return '';
        const seg = line.segments[currentSegmentIndex];
        return seg?.text || '';
    }, [lines, currentLineIndex, currentSegmentIndex]);

    return (
        <EditorContext.Provider
            value={{
                lines,
                currentLineIndex,
                currentSegmentIndex,
                mode,
                viewMode,
                hasUnsavedChanges,
                showConfidenceColors,
                canUndo: undoStack.length > 0,
                canRedo: redoStack.length > 0,
                importText,
                splitSegment,
                mergeSegments,
                editSegment,
                setActiveSegment,
                setMode,
                setViewMode,
                toggleConfidenceColors,
                navigateLeft,
                navigateRight,
                navigateUp,
                navigateDown,
                undo,
                redo,
                save,
                exportData,
                clearAll,
                markLineReviewed,
                setLines,
                getSegmentedWord,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
}
