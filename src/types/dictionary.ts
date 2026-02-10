export interface DictionaryEntry {
    word: string;
    segments: string[];
    pos?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'conjunction' | 'particle' | 'postposition' | 'pronoun' | 'adj' | 'other';
    frequency?: number;
    notes?: string;
    definition?: string;
    domain?: string;
}

export interface DictionaryFile {
    version: string;
    language: string;
    name?: string;
    nameMyanmar?: string;
    description?: string;
    category?: string;
    source?: string;
    license?: string;
    entries: DictionaryEntry[];
}

export interface DictionaryIndexEntry {
    id: string;
    name: string;
    nameMyanmar: string;
    path: string;
    category: string;
    source: string;
    license: string;
    entryCount: number;
    enabled: boolean;
}

export interface DictionaryIndex {
    version: string;
    lastUpdated: string;
    totalEntries: number;
    dictionaries: DictionaryIndexEntry[];
}

export interface LoadedDictionary {
    id: string;
    name: string;
    nameMyanmar?: string;
    source: string; // 'bundled' | 'file' | 'imported'
    category: string;
    license?: string;
    entries: DictionaryEntry[];
    entryCount: number;
    loadedAt: string;
    enabled: boolean;
}

// Rich lookup result for sidebar display (spec §5.C, §17)
export interface DictLookupMatch {
    word: string;
    segments: string[];
    pos?: string;
    definition?: string;
    sourceName: string;   // Dictionary display name
    sourceType: 'manual' | 'auto' | 'external';
    category?: string;
    count?: number;
    isAmbiguous?: boolean;
}

export interface DictLookupResult {
    word: string;
    matches: DictLookupMatch[];
    totalMatches: number;
}
