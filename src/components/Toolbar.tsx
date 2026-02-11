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
import {
    FileEdit, Sun, Moon, Languages, FolderOpen, Download, Save,
    Trash2, Undo2, Redo2, Eraser, Ruler, FileText, ScrollText,
    Palette, BookOpen, Book, ChevronDown, PanelRightOpen,
    PanelRightClose, HelpCircle, File, Eye
} from 'lucide-react';

interface ToolbarProps {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
    onOpenHelp: () => void;
}

export default function Toolbar({ toggleSidebar, isSidebarOpen, onOpenHelp }: ToolbarProps) {
    const {
        lines, importText, importTextWithML, save, exportData, hasUnsavedChanges,
        viewMode, setViewMode, toggleConfidenceColors, showConfidenceColors,
        canUndo, canRedo, undo, redo, setLines, clearAll,
        segmentationMethod, isMLSegmenting, mlError,
        syncStatus
    } = useEditor();

    const { t, language, setLanguage } = useI18n();
    const { scanForConflicts } = useConflicts();
    const { isDark, toggleTheme } = useTheme();
    const { loadDictionaryFileWithConflicts, resolveImportConflicts, exportToDictionary } = useGlossary();

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dictionaryInputRef = useRef<HTMLInputElement>(null);

    // Dropdown States
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [importConflictData, setImportConflictData] = useState<{ conflicts: ImportConflict[]; dictionary: LoadedDictionary } | null>(null);

    // Helpers
    const toggleMenu = (menu: string) => setActiveMenu(activeMenu === menu ? null : menu);
    const closeMenus = () => setActiveMenu(null);
    const hasContent = lines.length > 0;

    // Handlers
    const handleImport = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (segmentationMethod === 'ml') await importTextWithML(text);
            else importText(text);
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
            segments: line.segments.map(seg => ({ ...seg, text: seg.text.replace(/\u200B/g, '') })),
            originalText: cleanText(line.originalText),
        }));
        setLines(cleaned);
    };

    const handleNormalizeSpaces = () => {
        const cleaned = lines.map(line => ({
            ...line,
            segments: line.segments.map(seg => ({ ...seg, text: normalizeSpaces(seg.text) })),
            originalText: normalizeSpaces(line.originalText),
        }));
        setLines(cleaned);
    };

    const handleClear = () => {
        if (hasContent && window.confirm('Clear all content? This cannot be undone.')) {
            clearAll();
        }
    };

    const handleImportDictionary = () => dictionaryInputRef.current?.click();

    const handleDictionaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const result = await loadDictionaryFileWithConflicts(file);
            if (result) setImportConflictData(result);
            else alert(`Dictionary "${file.name}" loaded successfully!`);
        } catch (error) {
            alert(`Failed to load dictionary: ${error}`);
        }
        e.target.value = '';
    };

    const handleResolveConflicts = (dictionary: LoadedDictionary, resolutions: Map<string, 'keep' | 'replace'>) => {
        resolveImportConflicts(dictionary, resolutions);
        setImportConflictData(null);
        alert(`Dictionary imported with resolutions applied.`);
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 select-none">
            {/* Main Header Bar */}
            <div className="flex items-center justify-between px-4 h-14">

                {/* Left: Branding & Menu */}
                <div className="flex items-center gap-6">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2.5">
                        <div className="bg-indigo-600 rounded-lg p-1.5 shadow-lg shadow-indigo-500/30">
                            <FileEdit className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                Segdictor
                            </h1>
                            <span className="text-[10px] text-slate-500 font-medium">AI-Powered Segmentation</span>
                        </div>
                    </div>

                    {/* Compact NavMenu Style Menus */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">

                        {/* FILE MENU */}
                        <div className="relative">
                            <button
                                onClick={() => toggleMenu('file')}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all flex items-center gap-1.5"
                            >
                                <File className="w-3.5 h-3.5" /> File <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                            {activeMenu === 'file' && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={closeMenus} />
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 animate-in fade-in zoom-in-95">
                                        <button onClick={() => { handleImport(); closeMenus(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2">
                                            <FolderOpen className="w-3.5 h-3.5" /> Import Text
                                        </button>
                                        <button onClick={() => { handleImportDictionary(); closeMenus(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2">
                                            <BookOpen className="w-3.5 h-3.5" /> Import Dictionary
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                        <button onClick={() => { handleExport(); closeMenus(); }} disabled={!hasContent} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 disabled:opacity-50 flex items-center gap-2">
                                            <Download className="w-3.5 h-3.5" /> Export Dataset
                                        </button>
                                        <button onClick={() => { exportToDictionary('json'); closeMenus(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                            <Book className="w-3.5 h-3.5" /> Export Glossary
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                        <button onClick={() => { handleClear(); closeMenus(); }} disabled={!hasContent} className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 disabled:opacity-50 flex items-center gap-2">
                                            <Trash2 className="w-3.5 h-3.5" /> Clear Workspace
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* EDIT MENU */}
                        <div className="relative">
                            <button
                                onClick={() => toggleMenu('edit')}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all flex items-center gap-1.5"
                            >
                                <FileEdit className="w-3.5 h-3.5" /> Edit <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                            {activeMenu === 'edit' && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={closeMenus} />
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 animate-in fade-in zoom-in-95">
                                        <button onClick={() => { undo(); closeMenus(); }} disabled={!canUndo} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2">
                                            <Undo2 className="w-3.5 h-3.5" /> Undo
                                        </button>
                                        <button onClick={() => { redo(); closeMenus(); }} disabled={!canRedo} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2">
                                            <Redo2 className="w-3.5 h-3.5" /> Redo
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                        <button onClick={() => { handleCleanZWSP(); closeMenus(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <Eraser className="w-3.5 h-3.5" /> Clean ZWSP
                                        </button>
                                        <button onClick={() => { handleNormalizeSpaces(); closeMenus(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <Ruler className="w-3.5 h-3.5" /> Normalize Spaces
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* VIEW MENU */}
                        <div className="relative">
                            <button
                                onClick={() => toggleMenu('view')}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all flex items-center gap-1.5"
                            >
                                <Eye className="w-3.5 h-3.5" /> View <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                            {activeMenu === 'view' && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={closeMenus} />
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 animate-in fade-in zoom-in-95">
                                        <button onClick={() => { setViewMode(viewMode === 'line' ? 'paragraph' : 'line'); closeMenus(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            {viewMode === 'line' ? <FileText className="w-3.5 h-3.5" /> : <ScrollText className="w-3.5 h-3.5" />}
                                            Switch to {viewMode === 'line' ? 'Paragraph' : 'Line'} View
                                        </button>
                                        <button onClick={() => { toggleConfidenceColors(); closeMenus(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <Palette className="w-3.5 h-3.5" /> {showConfidenceColors ? 'Hide' : 'Show'} Colors
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Quick Save Action */}
                    <button
                        onClick={save}
                        disabled={!hasUnsavedChanges}
                        className={`p-2 rounded-full transition-colors ${hasUnsavedChanges ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-400'}`}
                        title="Save Progress (Ctrl+S)"
                    >
                        <Save className="w-5 h-5" />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-colors"
                        title="Toggle Theme"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Help / Quick Start */}
                    <button
                        onClick={onOpenHelp}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                        title="Quick Start Guide"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                    {/* Sidebar Toggle */}
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
                        title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        {isSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Hidden Inputs */}
            <input ref={fileInputRef} type="file" accept=".txt,.text" onChange={handleFileChange} className="hidden" />
            <input ref={dictionaryInputRef} type="file" accept=".json" onChange={handleDictionaryFileChange} className="hidden" />

            {/* Modals */}
            {importConflictData && (
                <DictImportConflictModal
                    conflicts={importConflictData.conflicts}
                    dictionary={importConflictData.dictionary}
                    onResolve={handleResolveConflicts}
                    onCancel={() => setImportConflictData(null)}
                />
            )}

            {/* Loading / Error States (ML) */}
            {isMLSegmenting && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-100 overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-progress"></div>
                </div>
            )}
        </div>
    );
}
