'use client';

import React, { useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { useI18n } from '../context/I18nContext';
import { useConflicts } from '../context/ConflictContext';
import { useTheme } from '../context/ThemeContext';
import { useGlossary } from '../context/GlossaryContext';
import { cleanText, normalizeSpaces } from '../lib/sylbreak';
import DictImportConflictModal from './DictImportConflictModal';
import { ImportConflict } from '../utils/dictionaryService';
import { LoadedDictionary } from '../types/dictionary';
import { FileEdit, Sun, Moon, Languages, FolderOpen, Download, Save, Trash2, Undo2, Redo2, Eraser, Ruler, FileText, ScrollText, Palette, BookOpen, Book, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';

export default function Toolbar() {
    const {
        lines, importText, save, exportData, hasUnsavedChanges,
        viewMode, setViewMode, toggleConfidenceColors, showConfidenceColors,
        canUndo, canRedo, undo, redo, setLines, clearAll,
    } = useEditor();
    const { t, language, setLanguage } = useI18n();
    const { scanForConflicts } = useConflicts();
    const { isDark, toggleTheme } = useTheme();
    const { loadDictionaryFile, loadDictionaryFileWithConflicts, resolveImportConflicts, exportToDictionary, externalDictionaries } = useGlossary();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dictionaryInputRef = useRef<HTMLInputElement>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [importConflictData, setImportConflictData] = useState<{ conflicts: ImportConflict[]; dictionary: LoadedDictionary } | null>(null);

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            importText(text);
            setTimeout(() => scanForConflicts(lines), 500);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExport = () => {
        const data = exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.projectMeta.name}_${data.projectMeta.createdAt}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCleanZWSP = () => {
        const cleaned = lines.map(line => ({
            ...line,
            segments: line.segments.map(seg => ({
                ...seg,
                text: seg.text.replace(/\u200B/g, ''),
            })),
            originalText: cleanText(line.originalText),
        }));
        setLines(cleaned);
    };

    const handleNormalizeSpaces = () => {
        const cleaned = lines.map(line => ({
            ...line,
            segments: line.segments.map(seg => ({
                ...seg,
                text: normalizeSpaces(seg.text),
            })),
            originalText: normalizeSpaces(line.originalText),
        }));
        setLines(cleaned);
    };

    const hasContent = lines.length > 0;

    const handleClear = () => {
        if (hasContent && window.confirm('Clear all content? This cannot be undone.')) {
            clearAll();
        }
    };

    const handleImportDictionary = () => {
        dictionaryInputRef.current?.click();
    };

    const handleDictionaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await loadDictionaryFileWithConflicts(file);
            if (result) {
                // Conflicts detected — show modal
                setImportConflictData(result);
            } else {
                // No conflicts, imported successfully
                alert(`Dictionary "${file.name}" loaded successfully!`);
            }
        } catch (error) {
            alert(`Failed to load dictionary: ${error}`);
        }
        e.target.value = '';
    };

    const handleResolveConflicts = (dictionary: LoadedDictionary, resolutions: Map<string, 'keep' | 'replace'>) => {
        resolveImportConflicts(dictionary, resolutions);
        setImportConflictData(null);
        alert(`Dictionary "${dictionary.nameMyanmar || dictionary.name}" imported with conflict resolutions applied.`);
    };

    return (
        <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
            {/* Top Row: Branding + Actions */}
            <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                {/* Left: Branding */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <FileEdit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                    MS Myan-Seg-Editor
                                </h1>
                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold rounded uppercase tracking-wide">
                                    Alpha
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                v1.1.0 (Conflict Aware)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Theme, Language, Status */}
                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-md text-[10px] font-semibold animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 dark:bg-amber-400 rounded-full"></span>
                            {t('unsavedChanges')}
                        </span>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-base hover:scale-105"
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'mm' : 'en')}
                        className="px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                        {language === 'en' ? <><Languages className="w-3 h-3" /> မြန်မာ</> : <><Languages className="w-3 h-3" /> English</>}
                    </button>
                </div>
            </div>

            {/* Bottom Row: Action Buttons */}
            <div className="flex items-center justify-between px-4 pb-2.5 gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                {/* Left: File Operations */}
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".txt,.text"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={handleImport}
                        className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
                    >
                        <FolderOpen className="w-4 h-4" /> {t('importText')}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!hasContent}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
                    >
                        <Download className="w-4 h-4" /> {t('exportDataset')}
                    </button>
                    <button
                        onClick={save}
                        disabled={!hasUnsavedChanges}
                        className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
                    >
                        <Save className="w-4 h-4" /> {t('saveProgress')}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={!hasContent}
                        className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
                    >
                        <Trash2 className="w-4 h-4" /> {t('clearWorkspace')}
                    </button>



                    {/* Undo / Redo */}
                    <div className="border-l border-slate-200 dark:border-slate-700 pl-2 ml-1 flex gap-1">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-base disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-base disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            <Redo2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Center: Tools & View */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCleanZWSP}
                        disabled={!hasContent}
                        className="px-3 py-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 rounded-md text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                        <Eraser className="w-4 h-4" /> {t('cleanZWSP')}
                    </button>
                    <button
                        onClick={handleNormalizeSpaces}
                        disabled={!hasContent}
                        className="px-3 py-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 rounded-md text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                        <Ruler className="w-4 h-4" /> {t('normalizeSpaces')}
                    </button>

                    <div className="border-l border-slate-200 dark:border-slate-700 pl-2 ml-1 flex gap-1.5">
                        <button
                            onClick={() => setViewMode(viewMode === 'line' ? 'paragraph' : 'line')}
                            className="px-3 py-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                        >
                            {viewMode === 'line' ? <FileText className="w-4 h-4" /> : <ScrollText className="w-4 h-4" />}
                            {viewMode === 'line' ? t('paragraphView') : t('lineView')}
                        </button>
                        <button
                            onClick={toggleConfidenceColors}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${showConfidenceColors
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            <Palette className="w-4 h-4" /> {showConfidenceColors ? t('hideConfidenceColors') : t('showConfidenceColors')}
                        </button>
                    </div>

                    {/* Dictionary Operations */}
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>

                    <button
                        onClick={handleImportDictionary}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-md text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
                        title="Import Dictionary JSON"
                    >
                        <BookOpen className="w-4 h-4" /> Import Dict
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-md text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
                            title="Export Manual Dictionary"
                        >
                            <Book className="w-4 h-4" /> Export Dict <ChevronDown className="w-3 h-3 opacity-70" />
                        </button>
                        {showExportMenu && (
                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 min-w-[140px] py-1 animate-in fade-in">
                                <button
                                    onClick={() => { exportToDictionary('json'); setShowExportMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2 transition-colors"
                                >
                                    <FileJson className="w-3 h-3" /> Export as JSON
                                </button>
                                <button
                                    onClick={() => { exportToDictionary('csv'); setShowExportMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2 transition-colors"
                                >
                                    <FileSpreadsheet className="w-3 h-3" /> Export as CSV
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden dictionary file input */}
            <input
                ref={dictionaryInputRef}
                type="file"
                accept=".json"
                onChange={handleDictionaryFileChange}
                className="hidden"
            />

            {/* Click-away overlay for export menu */}
            {showExportMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
            )}

            {/* Import Conflict Modal */}
            {importConflictData && (
                <DictImportConflictModal
                    conflicts={importConflictData.conflicts}
                    dictionary={importConflictData.dictionary}
                    onResolve={handleResolveConflicts}
                    onCancel={() => setImportConflictData(null)}
                />
            )}
        </div>
    );
}
