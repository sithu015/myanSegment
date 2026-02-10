'use client';

import React, { useState } from 'react';
import { ImportConflict } from '../utils/dictionaryService';
import { LoadedDictionary } from '../types/dictionary';

interface Props {
    conflicts: ImportConflict[];
    dictionary: LoadedDictionary;
    onResolve: (dictionary: LoadedDictionary, resolutions: Map<string, 'keep' | 'replace'>) => void;
    onCancel: () => void;
}

export default function DictImportConflictModal({ conflicts, dictionary, onResolve, onCancel }: Props) {
    const [resolutions, setResolutions] = useState<Map<string, 'keep' | 'replace'>>(() => {
        const map = new Map<string, 'keep' | 'replace'>();
        conflicts.forEach(c => map.set(c.word, 'keep'));
        return map;
    });

    const setAll = (value: 'keep' | 'replace') => {
        const map = new Map<string, 'keep' | 'replace'>();
        conflicts.forEach(c => map.set(c.word, value));
        setResolutions(map);
    };

    const toggleResolution = (word: string) => {
        setResolutions(prev => {
            const next = new Map(prev);
            next.set(word, prev.get(word) === 'keep' ? 'replace' : 'keep');
            return next;
        });
    };

    const keepCount = Array.from(resolutions.values()).filter(v => v === 'keep').length;
    const replaceCount = Array.from(resolutions.values()).filter(v => v === 'replace').length;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">⚠️</span>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            Dictionary Import Conflicts
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <strong>{dictionary.nameMyanmar || dictionary.name}</strong> contains {conflicts.length} word(s) that conflict with your existing glossary.
                        Choose which segmentation to keep for each word.
                    </p>
                </div>

                {/* Bulk actions */}
                <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Master Authority:</span>
                    <button
                        onClick={() => setAll('keep')}
                        className="text-[10px] px-2 py-1 rounded-md font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        Keep All Existing
                    </button>
                    <button
                        onClick={() => setAll('replace')}
                        className="text-[10px] px-2 py-1 rounded-md font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        Use All Imported
                    </button>
                    <div className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
                        Keep: {keepCount} • Replace: {replaceCount}
                    </div>
                </div>

                {/* Conflict list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {conflicts.map(conflict => {
                        const resolution = resolutions.get(conflict.word) || 'keep';
                        return (
                            <div
                                key={conflict.word}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 myanmar-text">
                                        {conflict.word}
                                    </span>
                                    <button
                                        onClick={() => toggleResolution(conflict.word)}
                                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${resolution === 'keep'
                                                ? 'bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300'
                                                : 'bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300'
                                            }`}
                                    >
                                        {resolution === 'keep' ? '📖 Keep Existing' : '📚 Use Imported'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className={`p-2 rounded-lg border ${resolution === 'keep'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 opacity-60'
                                        }`}>
                                        <div className="font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                                            Existing ({conflict.existingSource})
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400 myanmar-text">
                                            [{conflict.existingSegments.join(' | ')}]
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${resolution === 'replace'
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                                            : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 opacity-60'
                                        }`}>
                                        <div className="font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                                            Imported
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400 myanmar-text">
                                            [{conflict.importedSegments.join(' | ')}]
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onResolve(dictionary, resolutions)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                        Apply & Import ({conflicts.length} words)
                    </button>
                </div>
            </div>
        </div>
    );
}
