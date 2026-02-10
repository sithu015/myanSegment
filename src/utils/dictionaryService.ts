import { DictionaryFile, DictionaryEntry, LoadedDictionary } from '../types/dictionary';

/**
 * Parse and validate a dictionary JSON file
 */
export function parseDictionaryFile(content: string, filename: string): LoadedDictionary {
    try {
        const data = JSON.parse(content) as DictionaryFile;

        // Validation
        if (!data.version || !data.language || !Array.isArray(data.entries)) {
            throw new Error('Invalid dictionary format: missing required fields');
        }

        // Validate entries
        const validEntries = data.entries.filter(entry =>
            entry.word &&
            Array.isArray(entry.segments) &&
            entry.segments.length > 0
        );

        if (validEntries.length === 0) {
            throw new Error('Dictionary contains no valid entries');
        }

        return {
            id: `imported-${filename.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
            name: data.name || filename,
            nameMyanmar: data.nameMyanmar,
            source: 'imported',
            category: data.category || 'custom',
            license: data.license,
            entries: validEntries,
            entryCount: validEntries.length,
            loadedAt: new Date().toISOString(),
            enabled: true,
        };
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON format');
        }
        throw error;
    }
}

/**
 * Load dictionary from a File object
 */
export async function loadDictionaryFromFile(file: File): Promise<LoadedDictionary> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const dictionary = parseDictionaryFile(content, file.name);
                resolve(dictionary);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Export entries to dictionary file format
 */
export function exportToDictionaryFile(
    entries: Array<{ word: string; segments: string[] }>,
    metadata: {
        name?: string;
        description?: string;
        language?: string;
    } = {}
): string {
    const dictionaryFile: DictionaryFile = {
        version: '1.0',
        language: metadata.language || 'my',
        name: metadata.name || 'Myanmar Word Dictionary',
        description: metadata.description || 'Exported from Myan-Seg-Editor',
        entries: entries.map(entry => ({
            word: entry.word,
            segments: entry.segments,
        })),
    };

    return JSON.stringify(dictionaryFile, null, 2);
}

/**
 * Merge multiple dictionary sources, removing duplicates
 * Priority: manual > imported > auto
 */
export function mergeDictionaries(
    sources: Array<{ entries: DictionaryEntry[]; priority: number }>
): DictionaryEntry[] {
    const wordMap = new Map<string, DictionaryEntry & { priority: number }>();

    // Sort by priority (higher first)
    const sortedSources = sources.sort((a, b) => b.priority - a.priority);

    for (const source of sortedSources) {
        for (const entry of source.entries) {
            const existing = wordMap.get(entry.word);
            if (!existing || source.priority > existing.priority) {
                wordMap.set(entry.word, { ...entry, priority: source.priority });
            }
        }
    }

    return Array.from(wordMap.values()).map(({ priority, ...entry }) => entry);
}

/**
 * Download file with specified MIME type
 */
export function downloadFile(content: string, filename: string, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/** @deprecated Use downloadFile instead */
export function downloadDictionaryFile(content: string, filename: string) {
    downloadFile(content, filename, 'application/json');
}

/**
 * Export glossary entries as CSV (spec §17)
 * Columns: word, segments, source, count, pos
 */
export function exportGlossaryAsCSV(
    entries: Array<{ word: string; segments: string[]; source: string; count: number; pos?: string }>
): string {
    const header = 'word,segments,source,count,pos';
    const rows = entries.map(e => {
        const segments = e.segments.join('|');
        const pos = e.pos || '';
        // Escape fields with commas/quotes
        const escapeCSV = (s: string) => s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        return [escapeCSV(e.word), escapeCSV(segments), e.source, e.count, pos].join(',');
    });
    return [header, ...rows].join('\n');
}

/**
 * Detect conflicts between imported dictionary and existing glossary entries
 * Returns entries where the same word has different segmentation
 */
export interface ImportConflict {
    word: string;
    existingSegments: string[];
    importedSegments: string[];
    existingSource: string;
}

export function detectImportConflicts(
    importedEntries: DictionaryEntry[],
    existingManual: Array<{ word: string; segments: string[] }>,
    existingAuto: Array<{ word: string; segments: string[] }>
): ImportConflict[] {
    const conflicts: ImportConflict[] = [];

    for (const imported of importedEntries) {
        // Check manual glossary
        const manual = existingManual.find(e => e.word === imported.word);
        if (manual && manual.segments.join('|') !== imported.segments.join('|')) {
            conflicts.push({
                word: imported.word,
                existingSegments: manual.segments,
                importedSegments: imported.segments,
                existingSource: 'manual',
            });
            continue;
        }
        // Check auto glossary
        const auto = existingAuto.find(e => e.word === imported.word);
        if (auto && auto.segments.join('|') !== imported.segments.join('|')) {
            conflicts.push({
                word: imported.word,
                existingSegments: auto.segments,
                importedSegments: imported.segments,
                existingSource: 'auto',
            });
        }
    }

    return conflicts;
}
