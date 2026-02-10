'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { GlossaryEntry, Glossary, GlossarySource } from '../types';
import { LoadedDictionary, DictLookupResult, DictLookupMatch } from '../types/dictionary';
import { loadDictionaryFromFile, exportToDictionaryFile, downloadFile, exportGlossaryAsCSV, detectImportConflicts, ImportConflict } from '../utils/dictionaryService';
import { loadAllDictionaries } from '../lib/loadDictionaries';

const STORAGE_KEY = 'myan-seg-glossary';
const AUTO_PROMOTE_THRESHOLD = 3; // spec §3.2: 3+ consistent uses → permanent

interface GlossaryContextType {
    glossary: Glossary;
    externalDictionaries: LoadedDictionary[];
    dictionariesLoading: boolean;
    addToManualGlossary: (word: string, segments: string[]) => void;
    removeFromGlossary: (word: string, source: GlossarySource) => void;
    trackSegmentation: (word: string, segments: string[]) => void; // auto memory
    lookupWord: (word: string) => GlossaryEntry | null;
    lookupWordFull: (word: string) => DictLookupResult | null; // Rich lookup (spec §5.C)
    getAutoSuggestions: (word: string) => string[][] | null;
    markAmbiguous: (word: string) => void;
    isAmbiguous: (word: string) => boolean;
    exportGlossary: () => string; // JSON export
    importGlossary: (json: string) => void;
    clearGlossary: () => void;
    // Dictionary file functions
    loadDictionaryFile: (file: File) => Promise<void>;
    loadDictionaryFileWithConflicts: (file: File) => Promise<{ conflicts: ImportConflict[]; dictionary: LoadedDictionary } | null>;
    resolveImportConflicts: (dictionary: LoadedDictionary, resolutions: Map<string, 'keep' | 'replace'>) => void;
    removeDictionary: (name: string) => void;
    exportToDictionary: (format?: 'json' | 'csv') => void;
    toggleDictionary: (id: string) => void;
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export function GlossaryProvider({ children }: { children: ReactNode }) {
    const [glossary, setGlossary] = useState<Glossary>({ manual: [], auto: [] });
    const [externalDictionaries, setExternalDictionaries] = useState<LoadedDictionary[]>([]);
    const [dictionariesLoading, setDictionariesLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [autoLoadComplete, setAutoLoadComplete] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setGlossary(JSON.parse(stored));
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    // Auto-load all dictionaries on mount (async runtime fetch)
    useEffect(() => {
        if (!mounted || autoLoadComplete) return;

        setDictionariesLoading(true);
        loadAllDictionaries()
            .then(loadedDicts => {
                setExternalDictionaries(loadedDicts);
                setAutoLoadComplete(true);
                setDictionariesLoading(false);
            })
            .catch(error => {
                console.error('Failed to auto-load dictionaries:', error);
                setAutoLoadComplete(true);
                setDictionariesLoading(false);
            });
    }, [mounted, autoLoadComplete]);

    // Save to localStorage on every change (after mount)
    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(glossary));
        } catch {
            // ignore storage errors
        }
    }, [glossary, mounted]);

    const addToManualGlossary = useCallback((word: string, segments: string[]) => {
        setGlossary(prev => {
            // Check if already exists
            const existing = prev.manual.find(e => e.word === word);
            if (existing) {
                return {
                    ...prev,
                    manual: prev.manual.map(e =>
                        e.word === word
                            ? { ...e, segments, count: e.count + 1 }
                            : e
                    ),
                };
            }
            return {
                ...prev,
                manual: [
                    ...prev.manual,
                    {
                        word,
                        segments,
                        source: 'manual' as GlossarySource,
                        count: 1,
                        addedAt: new Date().toISOString(),
                        isAmbiguous: false,
                    },
                ],
            };
        });
    }, []);

    const removeFromGlossary = useCallback((word: string, source: GlossarySource) => {
        setGlossary(prev => ({
            ...prev,
            [source]: prev[source].filter(e => e.word !== word),
        }));
    }, []);

    // Auto memory: track segmentation decisions (spec §3.2)
    const trackSegmentation = useCallback((word: string, segments: string[]) => {
        setGlossary(prev => {
            const existingAuto = prev.auto.find(e => e.word === word);
            const existingManual = prev.manual.find(e => e.word === word);

            // Skip if already in manual glossary
            if (existingManual) return prev;

            if (existingAuto) {
                const newCount = existingAuto.count + 1;
                // Auto-promote to manual if threshold reached
                if (newCount >= AUTO_PROMOTE_THRESHOLD) {
                    return {
                        manual: [
                            ...prev.manual,
                            {
                                ...existingAuto,
                                count: newCount,
                                source: 'manual' as GlossarySource,
                                segments,
                            },
                        ],
                        auto: prev.auto.filter(e => e.word !== word),
                    };
                }
                return {
                    ...prev,
                    auto: prev.auto.map(e =>
                        e.word === word ? { ...e, count: newCount, segments } : e
                    ),
                };
            }

            // Add new entry to auto
            return {
                ...prev,
                auto: [
                    ...prev.auto,
                    {
                        word,
                        segments,
                        source: 'auto' as GlossarySource,
                        count: 1,
                        addedAt: new Date().toISOString(),
                        isAmbiguous: false,
                    },
                ],
            };
        });
    }, []);

    // ── Pre-computed word index for O(1) lookups ──
    // Rebuilds whenever glossary or dictionaries change.
    // Deduplicates: same word+segments from different sources → one entry with merged source names.
    const wordIndex = React.useMemo(() => {
        const idx = new Map<string, DictLookupMatch[]>();

        const pushMatch = (word: string, match: DictLookupMatch) => {
            const existing = idx.get(word);
            if (existing) {
                // Deduplicate: if same segments already exist, merge source name
                const segKey = match.segments.join('|');
                const dup = existing.find(m => m.segments.join('|') === segKey && m.sourceType === match.sourceType);
                if (dup) {
                    // Already have this exact segmentation from same source type — skip
                    return;
                }
                existing.push(match);
            } else {
                idx.set(word, [match]);
            }
        };

        // 1. Manual glossary entries
        for (const entry of glossary.manual) {
            pushMatch(entry.word, {
                word: entry.word,
                segments: entry.segments,
                sourceName: 'Manual Glossary',
                sourceType: 'manual',
                count: entry.count,
                isAmbiguous: entry.isAmbiguous,
            });
        }

        // 2. Auto glossary entries
        for (const entry of glossary.auto) {
            pushMatch(entry.word, {
                word: entry.word,
                segments: entry.segments,
                sourceName: 'Auto Memory',
                sourceType: 'auto',
                count: entry.count,
                isAmbiguous: entry.isAmbiguous,
            });
        }

        // 3. External dictionaries (only enabled)
        for (const dict of externalDictionaries) {
            if (!dict.enabled) continue;
            for (const entry of dict.entries) {
                pushMatch(entry.word, {
                    word: entry.word,
                    segments: entry.segments,
                    pos: entry.pos,
                    definition: entry.definition,
                    sourceName: dict.nameMyanmar || dict.name,
                    sourceType: 'external',
                    category: dict.category,
                });
            }
        }

        console.log(`📇 Word index built: ${idx.size} unique words indexed`);
        return idx;
    }, [glossary, externalDictionaries]);

    // O(1) simple lookup — returns first match (priority: manual > external > auto)
    const lookupWord = useCallback((word: string): GlossaryEntry | null => {
        const matches = wordIndex.get(word);
        if (!matches || matches.length === 0) return null;

        // Priority order: manual > external > auto
        const priorityOrder: Record<string, number> = { manual: 0, external: 1, auto: 2 };
        const sorted = [...matches].sort((a, b) =>
            (priorityOrder[a.sourceType] ?? 9) - (priorityOrder[b.sourceType] ?? 9)
        );
        const best = sorted[0];

        return {
            word: best.word,
            segments: best.segments,
            source: (best.sourceType === 'external' ? 'manual' : best.sourceType) as GlossarySource,
            count: best.count ?? 0,
            addedAt: new Date().toISOString(),
            isAmbiguous: best.isAmbiguous ?? false,
        };
    }, [wordIndex]);

    // O(1) rich lookup — returns ALL matches across all sources (spec §5.C)
    const lookupWordFull = useCallback((word: string): DictLookupResult | null => {
        const matches = wordIndex.get(word);
        if (!matches || matches.length === 0) return null;

        return {
            word,
            matches,
            totalMatches: matches.length,
        };
    }, [wordIndex]);

    const getAutoSuggestions = useCallback((word: string): string[][] | null => {
        const entry = lookupWord(word);
        if (entry && !entry.isAmbiguous) {
            return [entry.segments];
        }
        return null;
    }, [lookupWord]);

    const markAmbiguous = useCallback((word: string) => {
        setGlossary(prev => ({
            manual: prev.manual.map(e =>
                e.word === word ? { ...e, isAmbiguous: true } : e
            ),
            auto: prev.auto.map(e =>
                e.word === word ? { ...e, isAmbiguous: true } : e
            ),
        }));
    }, []);

    const isAmbiguous = useCallback((word: string): boolean => {
        const entry = lookupWord(word);
        return entry?.isAmbiguous ?? false;
    }, [lookupWord]);

    const exportGlossary = useCallback((): string => {
        return JSON.stringify(glossary, null, 2);
    }, [glossary]);

    const importGlossary = useCallback((json: string) => {
        try {
            const imported = JSON.parse(json) as Glossary;
            setGlossary(imported);
        } catch (e) {
            console.error('Failed to import glossary:', e);
        }
    }, []);

    const clearGlossary = useCallback(() => {
        setGlossary({ manual: [], auto: [] });
    }, []);

    // Dictionary file functions — basic (auto-loads without conflict check)
    const handleLoadDictionaryFile = useCallback(async (file: File) => {
        try {
            const dictionary = await loadDictionaryFromFile(file);
            setExternalDictionaries(prev => {
                const filtered = prev.filter(d => d.name !== dictionary.name);
                return [...filtered, dictionary];
            });
        } catch (error) {
            console.error('Failed to load dictionary:', error);
            throw error;
        }
    }, []);

    // Load with conflict detection (spec §17: Master Authority)
    const loadDictionaryFileWithConflicts = useCallback(async (file: File): Promise<{ conflicts: ImportConflict[]; dictionary: LoadedDictionary } | null> => {
        try {
            const dictionary = await loadDictionaryFromFile(file);
            const conflicts = detectImportConflicts(
                dictionary.entries,
                glossary.manual,
                glossary.auto
            );
            if (conflicts.length === 0) {
                // No conflicts, just add
                setExternalDictionaries(prev => {
                    const filtered = prev.filter(d => d.name !== dictionary.name);
                    return [...filtered, dictionary];
                });
                return null;
            }
            return { conflicts, dictionary };
        } catch (error) {
            console.error('Failed to load dictionary:', error);
            throw error;
        }
    }, [glossary]);

    // Resolve import conflicts: 'keep' existing or 'replace' with imported
    const resolveImportConflicts = useCallback((dictionary: LoadedDictionary, resolutions: Map<string, 'keep' | 'replace'>) => {
        // Update manual glossary for 'replace' resolutions
        setGlossary(prev => {
            const updatedManual = prev.manual.map(entry => {
                const resolution = resolutions.get(entry.word);
                if (resolution === 'replace') {
                    const imported = dictionary.entries.find(e => e.word === entry.word);
                    if (imported) {
                        return { ...entry, segments: imported.segments };
                    }
                }
                return entry;
            });
            return { ...prev, manual: updatedManual };
        });
        // Add the dictionary
        setExternalDictionaries(prev => {
            const filtered = prev.filter(d => d.name !== dictionary.name);
            return [...filtered, dictionary];
        });
    }, []);

    const removeDictionary = useCallback((name: string) => {
        setExternalDictionaries(prev => prev.filter(d => d.name !== name));
    }, []);

    const toggleDictionary = useCallback((id: string) => {
        setExternalDictionaries(prev =>
            prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d)
        );
    }, []);

    // Export glossary as JSON or CSV (spec §17)
    const exportToDictionary = useCallback((format: 'json' | 'csv' = 'json') => {
        const entries = glossary.manual.map(entry => ({
            word: entry.word,
            segments: entry.segments,
        }));

        if (format === 'csv') {
            const csvContent = exportGlossaryAsCSV(
                glossary.manual.map(e => ({
                    word: e.word,
                    segments: e.segments,
                    source: e.source,
                    count: e.count,
                }))
            );
            downloadFile(csvContent, `myanmar-dictionary-${Date.now()}.csv`, 'text/csv');
        } else {
            const content = exportToDictionaryFile(entries, {
                name: 'Myan-Seg-Editor Dictionary',
                description: `Exported on ${new Date().toLocaleDateString()}`,
                language: 'my',
            });
            downloadFile(content, `myanmar-dictionary-${Date.now()}.json`);
        }
    }, [glossary]);

    return (
        <GlossaryContext.Provider
            value={{
                glossary,
                externalDictionaries,
                dictionariesLoading,
                addToManualGlossary,
                removeFromGlossary,
                trackSegmentation,
                lookupWord,
                lookupWordFull,
                getAutoSuggestions,
                markAmbiguous,
                isAmbiguous,
                exportGlossary,
                importGlossary,
                clearGlossary,
                loadDictionaryFile: handleLoadDictionaryFile,
                loadDictionaryFileWithConflicts,
                resolveImportConflicts,
                removeDictionary,
                exportToDictionary,
                toggleDictionary,
            }}
        >
            {children}
        </GlossaryContext.Provider>
    );
}

export function useGlossary() {
    const context = useContext(GlossaryContext);
    if (!context) {
        throw new Error('useGlossary must be used within a GlossaryProvider');
    }
    return context;
}
