'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { useI18n } from '../context/I18nContext';
import { useConflicts } from '../context/ConflictContext';
import { useGlossary } from '../context/GlossaryContext';
import SegmentBlock from './SegmentBlock';
import ContextMenu from './ContextMenu';
import ConflictResolutionModal from './ConflictResolutionModal';
import { segmentIntoSyllables } from '../lib/sylbreak';

export default function EditorWorkspace() {
    const {
        lines, currentLineIndex, currentSegmentIndex,
        mode, viewMode, showConfidenceColors,
        splitSegment, mergeSegments, editSegment,
        setActiveSegment, setMode, navigateLeft, navigateRight,
        navigateUp, navigateDown, undo, redo, save,
        markLineReviewed,
    } = useEditor();
    const { t } = useI18n();
    const { conflicts, scanForConflicts, activeConflict, setActiveConflict, getConflictsForLine } = useConflicts();
    const { addToManualGlossary } = useGlossary();

    // Shortcuts bar dismiss state
    const [showShortcuts, setShowShortcuts] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('hideShortcutsBar') !== 'true';
        }
        return true;
    });

    const dismissShortcuts = () => {
        setShowShortcuts(false);
        localStorage.setItem('hideShortcutsBar', 'true');
    };

    const restoreShortcuts = () => {
        setShowShortcuts(true);
        localStorage.removeItem('hideShortcutsBar');
    };

    const [editingText, setEditingText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const editInputRef = useRef<HTMLInputElement>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        x: number; y: number;
        lineIndex: number; segmentIndex: number;
    } | null>(null);

    // Scan for conflicts whenever lines change
    useEffect(() => {
        if (lines.length > 0) {
            const timer = setTimeout(() => scanForConflicts(lines), 300);
            return () => clearTimeout(timer);
        }
    }, [lines, scanForConflicts]);

    // Global keyboard handler for segmentation mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl shortcuts (global)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                redo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                save();
                return;
            }

            if (isEditing || mode !== 'segmentation' || lines.length === 0) return;

            const currentLine = lines[currentLineIndex];
            if (!currentLine) return;
            const currentSeg = currentLine.segments[currentSegmentIndex];
            if (!currentSeg) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    navigateLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    navigateRight();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    navigateUp();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    navigateDown();
                    break;
                case ' ':
                    e.preventDefault();
                    if (currentSeg.text.length > 1) {
                        const syllables = segmentIntoSyllables(currentSeg.text);
                        if (syllables.length > 1) {
                            const splitPos = syllables[0].length;
                            splitSegment(currentLineIndex, currentSegmentIndex, splitPos);
                        }
                    }
                    break;
                case 'Backspace':
                    e.preventDefault();
                    mergeSegments(currentLineIndex, currentSegmentIndex);
                    break;
                case 'F2':
                    e.preventDefault();
                    enterEditMode();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        mode, isEditing, lines, currentLineIndex, currentSegmentIndex,
        navigateLeft, navigateRight, navigateUp, navigateDown,
        splitSegment, mergeSegments, undo, redo, save,
    ]);

    const enterEditMode = useCallback(() => {
        const currentLine = lines[currentLineIndex];
        if (!currentLine) return;
        const currentSeg = currentLine.segments[currentSegmentIndex];
        if (!currentSeg) return;

        setEditingText(currentSeg.text);
        setIsEditing(true);
        setMode('edit');
        setTimeout(() => editInputRef.current?.focus(), 50);
    }, [lines, currentLineIndex, currentSegmentIndex, setMode]);

    const exitEditMode = useCallback((saveChanges: boolean) => {
        if (saveChanges && editingText.trim()) {
            editSegment(currentLineIndex, currentSegmentIndex, editingText);
        }
        setIsEditing(false);
        setMode('segmentation');
    }, [editingText, currentLineIndex, currentSegmentIndex, editSegment, setMode]);

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            exitEditMode(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            exitEditMode(false);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, lineIndex: number, segmentIndex: number) => {
        e.preventDefault();
        setActiveSegment(lineIndex, segmentIndex);
        setContextMenu({ x: e.clientX, y: e.clientY, lineIndex, segmentIndex });
    };

    const handleAddToDictionary = () => {
        if (!contextMenu) return;
        const line = lines[contextMenu.lineIndex];
        const seg = line.segments[contextMenu.segmentIndex];
        addToManualGlossary(seg.text, [seg.text]);
    };

    const handleSplitFromContextMenu = () => {
        if (!contextMenu) return;
        const seg = lines[contextMenu.lineIndex].segments[contextMenu.segmentIndex];
        if (seg.text.length > 1) {
            const syllables = segmentIntoSyllables(seg.text);
            if (syllables.length > 1) {
                splitSegment(contextMenu.lineIndex, contextMenu.segmentIndex, syllables[0].length);
            }
        }
    };

    // Empty state
    if (lines.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
                <div className="text-center p-10 max-w-md animate-fade-in">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-4xl">📝</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {t('noContentYet')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">{t('importPrompt')}</p>
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 text-left shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 text-sm">Getting Started</h3>
                        <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                                <span>Click <strong className="text-indigo-600 dark:text-indigo-400">&quot;📂 {t('importText')}&quot;</strong></span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                                <span>Select a Myanmar text file (.txt)</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                                <span>Start segmenting with <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">Space</kbd> / <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono">⌫</kbd></span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }



    // Mode indicator bar
    const ModeBar = () => (
        <div className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-700/40">
            <div className="flex items-center gap-3 py-2 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${mode === 'segmentation'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}>
                    {mode === 'segmentation' ? '✂️' : '✏️'} {mode === 'segmentation' ? t('segmentationMode') : t('editMode')}
                </span>

                {showShortcuts ? (
                    <div className="hidden md:flex items-center gap-1.5 ml-auto bg-white/80 dark:bg-slate-800/80 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex gap-2.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded text-[10px] shadow-sm border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-700 dark:text-slate-200">Space</kbd>
                                <span className="text-violet-600 dark:text-violet-400">Split</span>
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">│</span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded text-[10px] shadow-sm border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-700 dark:text-slate-200">⌫</kbd>
                                <span className="text-rose-600 dark:text-rose-400">Merge</span>
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">│</span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded text-[10px] shadow-sm border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-700 dark:text-slate-200">F2</kbd>
                                <span className="text-amber-600 dark:text-amber-400">Edit</span>
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">│</span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded text-[10px] shadow-sm border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-700 dark:text-slate-200">↑↓</kbd>
                                <span className="text-blue-600 dark:text-blue-400">Lines</span>
                            </span>
                        </div>
                        <button
                            onClick={dismissShortcuts}
                            className="ml-1.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Hide shortcuts"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={restoreShortcuts}
                        className="hidden md:flex ml-auto p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-xs"
                        title="Show keyboard shortcuts"
                    >
                        ⌨️
                    </button>
                )}
            </div>
        </div>
    );

    // Render modes
    const renderLineView = () => (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
            <ModeBar />
            <div className="p-4 space-y-2">
                {lines.map((line, lineIndex) => {
                    const lineConflicts = getConflictsForLine(lineIndex);
                    const hasConflicts = lineConflicts.length > 0;
                    const isActive = lineIndex === currentLineIndex;

                    return (
                        <div
                            key={line.id}
                            className={`rounded-xl p-4 transition-all duration-200 ${isActive
                                ? 'bg-amber-50/80 dark:bg-amber-900/10 shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20 ring-2 ring-amber-200 dark:ring-amber-700/40'
                                : hasConflicts
                                    ? 'bg-white/70 dark:bg-slate-800/50 ring-1 ring-amber-200/60 dark:ring-amber-700/40'
                                    : 'bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50 hover:shadow-sm'
                                }`}
                        >
                            {/* Line header */}
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                                    #{line.id}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {hasConflicts && (
                                        <button
                                            onClick={() => setActiveConflict(lineConflicts[0])}
                                            className="text-[10px] px-2 py-0.5 bg-amber-100/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200/80 transition-colors"
                                        >
                                            ⚠️ {lineConflicts.length}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => markLineReviewed(lineIndex)}
                                        className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${line.status === 'reviewed'
                                            ? 'bg-emerald-100/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {line.status === 'reviewed' ? '✅' : '○'} {line.status === 'reviewed' ? t('reviewed') : t('pending')}
                                    </button>
                                </div>
                            </div>

                            {/* Segments */}
                            <div className="flex flex-wrap gap-1.5">
                                {line.segments.map((segment, segIndex) => {
                                    if (isEditing && lineIndex === currentLineIndex && segIndex === currentSegmentIndex) {
                                        return (
                                            <input
                                                key={segment.id}
                                                ref={editInputRef}
                                                type="text"
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyDown={handleEditKeyDown}
                                                onBlur={() => exitEditMode(true)}
                                                className="px-3 py-1.5 border-2 border-orange-400 dark:border-orange-500 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-base outline-none focus:ring-2 focus:ring-orange-300 min-w-[60px] text-slate-800 dark:text-slate-200 myanmar-text"
                                            />
                                        );
                                    }

                                    return (
                                        <SegmentBlock
                                            key={segment.id}
                                            segment={segment}
                                            lineIndex={lineIndex}
                                            segmentIndex={segIndex}
                                            showConfidenceColors={showConfidenceColors}
                                            onClick={() => setActiveSegment(lineIndex, segIndex)}
                                            onDoubleClick={() => {
                                                setActiveSegment(lineIndex, segIndex);
                                                enterEditMode();
                                            }}
                                            onContextMenu={(e) => handleContextMenu(e, lineIndex, segIndex)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderParagraphView = () => (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
            <ModeBar />
            <div className="p-4">
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-wrap gap-1.5 leading-relaxed">
                        {lines.map((line, lineIndex) => (
                            <React.Fragment key={line.id}>
                                {line.segments.map((segment, segIndex) => {
                                    if (isEditing && lineIndex === currentLineIndex && segIndex === currentSegmentIndex) {
                                        return (
                                            <input
                                                key={segment.id}
                                                ref={editInputRef}
                                                type="text"
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyDown={handleEditKeyDown}
                                                onBlur={() => exitEditMode(true)}
                                                className="px-3 py-1.5 border-2 border-orange-400 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-base outline-none focus:ring-2 focus:ring-orange-300 min-w-[60px] text-slate-800 dark:text-slate-200 myanmar-text"
                                            />
                                        );
                                    }

                                    return (
                                        <SegmentBlock
                                            key={segment.id}
                                            segment={segment}
                                            lineIndex={lineIndex}
                                            segmentIndex={segIndex}
                                            showConfidenceColors={showConfidenceColors}
                                            onClick={() => setActiveSegment(lineIndex, segIndex)}
                                            onDoubleClick={() => {
                                                setActiveSegment(lineIndex, segIndex);
                                                enterEditMode();
                                            }}
                                            onContextMenu={(e) => handleContextMenu(e, lineIndex, segIndex)}
                                        />
                                    );
                                })}
                                {/* Line break indicator */}
                                <span className="w-full h-0" />
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col relative myanmar-text">
            {viewMode === 'line' ? renderLineView() : renderParagraphView()}

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onAddToDictionary={handleAddToDictionary}
                    onSplitHere={handleSplitFromContextMenu}
                    onMergeWithPrev={() => mergeSegments(contextMenu.lineIndex, contextMenu.segmentIndex)}
                    onMarkReviewed={() => markLineReviewed(contextMenu.lineIndex)}
                    canMerge={contextMenu.segmentIndex > 0}
                    isReviewed={lines[contextMenu.lineIndex]?.status === 'reviewed'}
                />
            )}

            {/* Conflict Resolution Modal */}
            {activeConflict && (
                <ConflictResolutionModal
                    conflict={activeConflict}
                    onClose={() => setActiveConflict(null)}
                />
            )}
        </div>
    );
}
