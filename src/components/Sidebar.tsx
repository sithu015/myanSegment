'use client';

import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { useI18n } from '../context/I18nContext';
import { useConflicts } from '../context/ConflictContext';
import { useGlossary } from '../context/GlossaryContext';
import { useGranularity } from '../context/GranularityContext';
import { GranularityPreset } from '../types';
import { BarChart2, ChevronDown, Scissors, PenTool, AlertTriangle, CheckCircle, Library, User, Bot, Book, BookOpen, AlertCircle, Settings, Keyboard } from 'lucide-react';

export default function Sidebar() {
    const { lines, mode, currentLineIndex, currentSegmentIndex, getSegmentedWord } = useEditor();
    const { t } = useI18n();
    const { conflicts, setActiveConflict } = useConflicts();
    const { glossary, lookupWord, lookupWordFull, externalDictionaries } = useGlossary();
    const { rules, activePreset, applyPreset, setRuleMode } = useGranularity();
    const [showStats, setShowStats] = useState(true);

    // Calculate statistics
    const totalLines = lines.length;
    const reviewedLines = lines.filter(l => l.status === 'reviewed').length;
    const totalSegments = lines.reduce((sum, l) => sum + l.segments.length, 0);
    const unresolvedConflicts = conflicts.filter(c => !c.resolved);
    const progress = totalLines > 0 ? Math.round((reviewedLines / totalLines) * 100) : 0;

    // Dictionary lookup for current word
    const currentWord = getSegmentedWord();
    const dictResult = currentWord ? lookupWordFull(currentWord) : null;

    // POS badge colors
    const posColors: Record<string, string> = {
        noun: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        verb: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        adjective: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        adj: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        adverb: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        conjunction: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
        particle: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
        postposition: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        pronoun: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    };

    const SectionHeader = ({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: number }) => (
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>{icon}</span> {title}
            {badge !== undefined && badge > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto">
                    {badge}
                </span>
            )}
        </h3>
    );

    return (
        <div className="w-72 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-l border-slate-200 dark:border-slate-700 overflow-y-auto flex flex-col shadow-sm">
            {/* Statistics — Collapsible */}
            <div className="p-4">
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="w-full flex items-center justify-between group"
                >
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5" /> {t('statistics')}
                        <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 ml-1">{progress}%</span>
                    </h3>
                    <span className={`text-slate-400 dark:text-slate-500 text-xs transition-transform duration-200 group-hover:text-slate-600 dark:group-hover:text-slate-300 ${showStats ? 'rotate-0' : '-rotate-90'}`}>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                </button>

                {showStats && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Progress Bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                                <span>{t('linesCompleted')}</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-900/10 rounded-xl p-3 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">{t('linesReviewed')}</div>
                                <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{reviewedLines}<span className="text-xs text-indigo-400 dark:text-indigo-500 ml-0.5">/{totalLines}</span></div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-900/10 rounded-xl p-3 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">{t('totalSegments')}</div>
                                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{totalSegments.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-4" />

            {/* Current Mode */}
            <div className="p-4">
                <div className={`rounded-xl p-2.5 text-center font-medium text-xs flex items-center justify-center gap-1.5 ${mode === 'segmentation'
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    }`}>
                    {mode === 'segmentation' ? <Scissors className="w-3.5 h-3.5" /> : <PenTool className="w-3.5 h-3.5" />} {mode === 'segmentation' ? t('segmentationMode') : t('editMode')}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-4" />

            {/* Conflict Monitor */}
            <div className="p-4">
                <SectionHeader icon={<AlertTriangle className="w-3.5 h-3.5" />} title={t('conflictMonitor')} badge={unresolvedConflicts.length} />

                {unresolvedConflicts.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3 text-center">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {t('noConflicts')}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {unresolvedConflicts.map(conflict => (
                            <button
                                key={conflict.id}
                                onClick={() => setActiveConflict(conflict)}
                                className="w-full text-left p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 hover:from-amber-100 hover:to-amber-100 dark:hover:from-amber-900/30 dark:hover:to-amber-900/20 transition-all shadow-sm border border-amber-100 dark:border-amber-800/50 hover:shadow-md"
                            >
                                <div className="text-xs font-semibold text-amber-800 dark:text-amber-200 truncate">
                                    &quot;{conflict.word}&quot;
                                </div>
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                    [{conflict.formA.join('|')}] vs [{conflict.formB.join('|')}]
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                                    {conflict.locationsA.length + conflict.locationsB.length} {t('occurrences')}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-4" />

            {/* Dictionary Lookup */}
            <div className="p-4">
                <SectionHeader icon={<Library className="w-3.5 h-3.5" />} title={t('dictionaryLookup')} />

                {currentWord ? (
                    <div className="space-y-2">
                        <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="text-base font-medium text-slate-800 dark:text-slate-200 myanmar-text">
                                    {currentWord}
                                </div>
                                {dictResult && dictResult.totalMatches > 1 && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-full font-semibold">
                                        {dictResult.totalMatches} matches
                                    </span>
                                )}
                            </div>
                            {dictResult ? (
                                <div className="space-y-2">
                                    {dictResult.matches.map((match, idx) => (
                                        <div key={idx} className={`${idx > 0 ? 'pt-2 border-t border-slate-200 dark:border-slate-700' : ''}`}>
                                            {/* Source + POS badges */}
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${match.sourceType === 'manual'
                                                    ? 'bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300'
                                                    : match.sourceType === 'auto'
                                                        ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300'
                                                    }`}>
                                                    {match.sourceType === 'manual' ? <User className="w-3 h-3" /> : match.sourceType === 'auto' ? <Bot className="w-3 h-3" /> : <Book className="w-3 h-3" />} {match.sourceName}
                                                </span>
                                                {match.pos && (
                                                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${posColors[match.pos] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                        {match.pos}
                                                    </span>
                                                )}
                                                {match.category && match.sourceType === 'external' && (
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${match.category === 'general' ? 'bg-green-100/60 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                                        match.category === 'phrases' ? 'bg-purple-100/60 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                                                            match.category === 'transliteration' ? 'bg-orange-100/60 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                                                'bg-slate-100/60 text-slate-500 dark:bg-slate-700/20 dark:text-slate-400'
                                                        }`}>
                                                        {match.category}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Segments */}
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                Segments: [{match.segments.join(' | ')}]
                                            </div>
                                            {/* Definition */}
                                            {match.definition && (
                                                <div className="text-[10px] text-slate-600 dark:text-slate-300 italic mt-0.5">
                                                    {match.definition}
                                                </div>
                                            )}
                                            {/* Count + Ambiguous */}
                                            {(match.count !== undefined && match.count > 0) && (
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    Seen {match.count}x
                                                    {match.isAmbiguous && (
                                                        <span className="ml-1 text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t('ambiguous')}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {t('notInDictionary')}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                            <span>{t('manualDictionary')}: {glossary.manual.length}</span>
                            <span>•</span>
                            <span>{t('autoDictionary')}: {glossary.auto.length}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3 text-center">
                        Select a segment to see dictionary info
                    </div>
                )}

                {/* External Dictionaries List */}
                {/* External Dictionaries List - Removed as per design update (all dicts combined) */}
                {(externalDictionaries.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 mt-2 text-center">
                            {externalDictionaries.reduce((sum, d) => sum + d.entryCount, 0).toLocaleString()} words loaded from {externalDictionaries.length} dictionaries
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-4" />

            {/* Granularity Settings */}
            <div className="p-4">
                <SectionHeader icon={<Settings className="w-3.5 h-3.5" />} title={t('granularitySettings')} />

                {/* Preset Buttons */}
                <div className="flex gap-1 mb-3 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg p-0.5">
                    {(['syllable', 'word', 'phrase'] as GranularityPreset[]).map(preset => (
                        <button
                            key={preset}
                            onClick={() => applyPreset(preset)}
                            className={`flex-1 py-1.5 text-[10px] font-semibold rounded-md transition-all ${activePreset === preset
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {preset === 'syllable' ? t('presetSyllable') :
                                preset === 'word' ? t('presetWord') : t('presetPhrase')}
                        </button>
                    ))}
                </div>

                {/* Rule Toggles */}
                <div className="space-y-1">
                    {rules.map(rule => (
                        <div key={rule.type} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate flex-1" title={rule.examples.join(', ')}>
                                {rule.label}
                            </span>
                            <button
                                onClick={() => setRuleMode(rule.type, rule.mode === 'split' ? 'merge' : 'split')}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${rule.mode === 'merge'
                                    ? 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-slate-200/80 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                {rule.mode === 'merge' ? 'Merge' : 'Split'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-4" />

            {/* Keyboard Shortcuts */}
            <div className="p-4">
                <SectionHeader icon={<Keyboard className="w-3.5 h-3.5" />} title={t('shortcuts')} />
                <div className="space-y-1">
                    {[
                        { key: 'Space', action: t('splitSegment') },
                        { key: '⌫', action: t('mergeSegments') },
                        { key: 'F2', action: t('enterEditMode') },
                        { key: '↑ ↓', action: t('navigateUpDown') },
                        { key: '⌘Z', action: t('undoShortcut') },
                        { key: '⌘⇧Z', action: t('redoShortcut') },
                        { key: '⌘S', action: t('saveShortcut') },
                    ].map(({ key, action }) => (
                        <div key={key} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{action}</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono min-w-[24px] text-center">
                                {key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
