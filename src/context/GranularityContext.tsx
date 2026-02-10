'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { GranularityRule, GranularityRuleType, GranularityPreset, GranularityRuleMode } from '../types';

const STORAGE_KEY = 'myan-seg-granularity';

// Default rules (spec §3.4)
const DEFAULT_RULES: GranularityRule[] = [
    {
        type: 'adp',
        label: 'Postpositional Markers (ADP)',
        labelMm: 'ပစ္စည်းများ',
        examples: ['က', 'ကို', 'မှာ', 'တွင်'],
        mode: 'split',
        enabled: true,
    },
    {
        type: 'plural',
        label: 'Plural Markers',
        labelMm: 'ဗဟုဝုစ်',
        examples: ['များ', 'တို့', 'တွေ'],
        mode: 'split',
        enabled: true,
    },
    {
        type: 'tense',
        label: 'Tense/Aspect Markers',
        labelMm: 'ကာလသတ်မှတ်ချက်',
        examples: ['သည်', 'မည်', 'ပြီ', 'ခဲ့'],
        mode: 'split',
        enabled: true,
    },
    {
        type: 'adverbial',
        label: 'Adverbial Suffix',
        labelMm: 'ကြိယာဝိသေသနပစ္စည်း',
        examples: ['စွာ'],
        mode: 'split',
        enabled: true,
    },
    {
        type: 'negation',
        label: 'Negation Grouping',
        labelMm: 'အငြင်းပုံစံ',
        examples: ['မ + verb'],
        mode: 'split',
        enabled: true,
    },
    {
        type: 'participle',
        label: 'Relative Participle',
        labelMm: 'ဆက်စပ်ပုဒ်',
        examples: ['သော', 'သည့်', 'မည့်'],
        mode: 'split',
        enabled: true,
    },
];

// Preset profiles (spec §3.4)
const PRESETS: Record<GranularityPreset, Partial<Record<GranularityRuleType, GranularityRuleMode>>> = {
    syllable: {
        adp: 'split',
        plural: 'split',
        tense: 'split',
        adverbial: 'split',
        negation: 'split',
        participle: 'split',
    },
    word: {
        adp: 'split',
        plural: 'merge',
        tense: 'split',
        adverbial: 'merge',
        negation: 'merge',
        participle: 'split',
    },
    phrase: {
        adp: 'merge',
        plural: 'merge',
        tense: 'merge',
        adverbial: 'merge',
        negation: 'merge',
        participle: 'merge',
    },
};

interface GranularityContextType {
    rules: GranularityRule[];
    activePreset: GranularityPreset | null;
    toggleRule: (type: GranularityRuleType) => void;
    setRuleMode: (type: GranularityRuleType, mode: GranularityRuleMode) => void;
    applyPreset: (preset: GranularityPreset) => void;
    getActiveRules: () => GranularityRule[];
}

const GranularityContext = createContext<GranularityContextType | undefined>(undefined);

export function GranularityProvider({ children }: { children: ReactNode }) {
    const [rules, setRules] = useState<GranularityRule[]>(DEFAULT_RULES);
    const [activePreset, setActivePreset] = useState<GranularityPreset | null>('syllable');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setRules(parsed.rules || DEFAULT_RULES);
                setActivePreset(parsed.activePreset || null);
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules, activePreset }));
        }
    }, [rules, activePreset, mounted]);

    const toggleRule = useCallback((type: GranularityRuleType) => {
        setRules(prev =>
            prev.map(r =>
                r.type === type ? { ...r, enabled: !r.enabled } : r
            )
        );
        setActivePreset(null); // Custom config
    }, []);

    const setRuleMode = useCallback((type: GranularityRuleType, mode: GranularityRuleMode) => {
        setRules(prev =>
            prev.map(r =>
                r.type === type ? { ...r, mode } : r
            )
        );
        setActivePreset(null);
    }, []);

    const applyPreset = useCallback((preset: GranularityPreset) => {
        const presetConfig = PRESETS[preset];
        setRules(prev =>
            prev.map(r => ({
                ...r,
                mode: presetConfig[r.type] || r.mode,
                enabled: true,
            }))
        );
        setActivePreset(preset);
    }, []);

    const getActiveRules = useCallback((): GranularityRule[] => {
        return rules.filter(r => r.enabled);
    }, [rules]);

    return (
        <GranularityContext.Provider
            value={{
                rules,
                activePreset,
                toggleRule,
                setRuleMode,
                applyPreset,
                getActiveRules,
            }}
        >
            {children}
        </GranularityContext.Provider>
    );
}

export function useGranularity() {
    const context = useContext(GranularityContext);
    if (!context) {
        throw new Error('useGranularity must be used within a GranularityProvider');
    }
    return context;
}
