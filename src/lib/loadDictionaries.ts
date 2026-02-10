import { DictionaryFile, DictionaryIndex, DictionaryIndexEntry, LoadedDictionary } from '@/types/dictionary';

// Use static import for the small legal dictionary (bundled at build time)
import myanmarWords from '../../data/dictionaries/myanmar_words.json';

/**
 * Small bundled dictionaries loaded at build time (< 50KB).
 * Large dictionaries are loaded at runtime via fetch from /dictionaries/*.
 */
export const bundledDictionaries: Array<{
    id: string;
    name: string;
    nameMyanmar?: string;
    category: string;
    source: string;
    license: string;
    data: DictionaryFile;
}> = [
        {
            id: 'legal-custom',
            name: 'Myanmar Legal & Common Terms',
            nameMyanmar: '',
            category: 'legal',
            source: 'custom',
            license: 'CC0-1.0',
            data: myanmarWords as DictionaryFile
        }
    ];

/**
 * Fetch the dictionary index from public/dictionaries/index.json
 */
export async function fetchDictionaryIndex(): Promise<DictionaryIndex | null> {
    try {
        const res = await fetch('/dictionaries/index.json');
        if (!res.ok) {
            console.warn(`Failed to fetch dictionary index: ${res.status}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.warn('Failed to fetch dictionary index:', error);
        return null;
    }
}

/**
 * Fetch and parse a single dictionary file from public/dictionaries/
 */
export async function fetchDictionary(entry: DictionaryIndexEntry): Promise<LoadedDictionary | null> {
    try {
        const res = await fetch(`/dictionaries/${entry.path}`);
        if (!res.ok) {
            console.warn(`Failed to fetch dictionary ${entry.name}: ${res.status}`);
            return null;
        }
        const data: DictionaryFile = await res.json();

        return {
            id: entry.id,
            name: data.name || entry.name,
            nameMyanmar: data.nameMyanmar || entry.nameMyanmar,
            source: 'bundled',
            category: entry.category,
            license: entry.license,
            entries: data.entries || [],
            entryCount: data.entries?.length || 0,
            loadedAt: new Date().toISOString(),
            enabled: entry.enabled,
        };
    } catch (error) {
        console.warn(`Failed to load dictionary ${entry.name}:`, error);
        return null;
    }
}

/**
 * Load all enabled dictionaries from the index.
 * Large dictionaries are loaded on-demand via fetch.
 * Small bundled dictionaries are included statically.
 */
export async function loadAllDictionaries(): Promise<LoadedDictionary[]> {
    const results: LoadedDictionary[] = [];

    // 1. Add small bundled dictionaries (static imports)
    for (const bundled of bundledDictionaries) {
        const dictFile = bundled.data;
        if (!dictFile.entries || !Array.isArray(dictFile.entries)) continue;

        results.push({
            id: bundled.id,
            name: dictFile.name || bundled.name,
            nameMyanmar: bundled.nameMyanmar,
            source: 'bundled',
            category: bundled.category,
            license: bundled.license,
            entries: dictFile.entries,
            entryCount: dictFile.entries.length,
            loadedAt: new Date().toISOString(),
            enabled: true,
        });
    }

    // 2. Fetch the index and load large dictionaries at runtime
    const index = await fetchDictionaryIndex();
    if (index) {
        const enabledDicts = index.dictionaries.filter(d => d.enabled);

        // Skip already-bundled ones
        const bundledIds = new Set(bundledDictionaries.map(b => b.id));
        const toFetch = enabledDicts.filter(d => !bundledIds.has(d.id));

        // Load in parallel
        const fetched = await Promise.allSettled(
            toFetch.map(entry => fetchDictionary(entry))
        );

        for (const result of fetched) {
            if (result.status === 'fulfilled' && result.value) {
                results.push(result.value);
            }
        }
    }

    console.log(`📚 Loaded ${results.length} dictionaries (${results.reduce((sum, d) => sum + d.entryCount, 0).toLocaleString()} total entries)`);
    return results;
}
