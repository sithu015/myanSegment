/**
 * Myanmar Syllable Segmentation (Sylbreak) Algorithm
 *
 * Port of the sylbreak regex from myWord / syl_segment.py
 * Original author: Ye Kyaw Thu (https://github.com/ye-kyaw-thu/sylbreak)
 * Reference: https://github.com/sithu015/myWord
 *
 * The algorithm inserts a break before:
 *   - A Myanmar consonant (က-အ) that is NOT preceded by ္ (subscript)
 *     AND NOT followed by ် (asat) or ္ (subscript)
 *   - English characters (a-z, A-Z, 0-9)
 *   - Other characters (independent vowels, Myanmar digits, punctuation, etc.)
 */

import { GranularityRule } from '../types';

// --- Character classes (matching syl_segment.py exactly) ---
const myConsonant = '\u1000-\u1021';              // က-အ
const enChar = 'a-zA-Z0-9';
const otherChar = '\u1023\u1024\u1025\u1026\u1027\u1029\u102A\u103F\u104C\u104D\u104E\u104F\u1040-\u1049\u104A\u104B' +
    '!\\-/:\\-@\\[\\-`\\{\\-~\\s';
const ssSymbol = '\u1039';                     // ္ (subscript/stacked symbol)
const aThat = '\u103A';                        // ် (asat/virama)
const visarga = '\u1037';                      // ့ (visarga/dot below)

// Delimiter used internally for splitting
const DELIMITER = '\u200B';  // ZWSP as internal delimiter

/**
 * The sylbreak RegExp — port of the Python RE from syl_segment.py
 * with enhancement to handle visarga combinations (င့်).
 *
 * Original Python pattern:
 *   r"((?<!္)[က-အ](?![်္])|[a-zA-Z0-9ဣဤဥဦဧဩဪဿ၌၍၏၀-၉၊။!-/:-@[-`{-~\s])"
 *
 * Enhancement: Added visarga (့, U+1037) to negative lookahead to prevent
 * breaking before consonants followed by visarga (e.g., နှင့်, ကျင့်, ခွင့်, ဖြင့်).
 *
 * JavaScript doesn't support lookbehind in all engines, but modern browsers
 * (Chrome 62+, Firefox 78+, Safari 16.4+) support it.
 */
const BreakPattern = new RegExp(
    '(' +
    '(?<!' + ssSymbol + ')[' + myConsonant + '](?![' + aThat + ssSymbol + visarga + '])' +
    '|' +
    '[' + enChar + otherChar + ']' +
    ')',
    'gu'
);

// --- Grammatical patterns for granularity rules (spec §3.4) ---
export const GRAMMAR_PATTERNS: Record<string, string[]> = {
    adp: [
        'က', 'ကို', 'မှာ', 'တွင်', '၌', 'သို့', 'မှ', 'နှင့်', 'နဲ့',
        'ဖြင့်', 'အတွက်', 'ကြောင့်', 'အား', '၏',
    ],
    plural: ['များ', 'တို့', 'တွေ'],
    tense: ['သည်', 'မည်', 'ပြီ', 'ခဲ့', 'နေ', 'ပါ', 'ပြီး'],
    adverbial: ['စွာ'],
    negation: ['မ'],
    participle: ['သော', 'သည့်', 'မည့်', 'ခဲ့သော', 'နေသော'],
};

/**
 * Post-process syllables to handle special cases:
 * - Merge consecutive Myanmar digits (၀-၉) into single numbers
 * - Separate parenthetical content with proper spacing
 */
function postProcessSyllables(syllables: string[]): string[] {
    const result: string[] = [];

    for (let i = 0; i < syllables.length; i++) {
        let segment = syllables[i];

        // Skip empty or whitespace-only segments
        if (!segment || segment.trim().length === 0) {
            continue;
        }

        // Handle parenthesis separation
        // Split on parentheses while keeping them in the result
        if (segment.includes('(') || segment.includes(')')) {
            const parts = segment.split(/([()])/g)
                .map(s => s.trim())
                .filter(s => s.length > 0);
            result.push(...parts);
            continue;
        }

        // Check if this segment is a Myanmar digit
        const isMyanmarDigit = /^[\u1040-\u1049]+$/.test(segment);

        if (isMyanmarDigit && result.length > 0) {
            // Check if previous segment is also a Myanmar digit
            const prevIsMyanmarDigit = /^[\u1040-\u1049]+$/.test(result[result.length - 1]);
            if (prevIsMyanmarDigit) {
                // Merge with previous digit
                result[result.length - 1] += segment;
                continue;
            }
        }

        result.push(segment);
    }

    return result;
}

/**
 * Core syllable segmentation — faithful port of syl_segment.py:
 *   BreakPattern.sub(delimiter + r"\1", line)
 *
 * Inserts a delimiter before every syllable break point, then splits.
 * Post-processes to handle Myanmar numbers and parentheses.
 */
export function segmentIntoSyllables(text: string): string[] {
    if (!text || !text.trim()) return [];

    const cleaned = cleanText(text);

    // Insert delimiter before each break point (same as Python's re.sub)
    const broken = cleaned.replace(BreakPattern, DELIMITER + '$1');

    // Split on delimiter and filter empty strings
    const syllables = broken
        .split(DELIMITER)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    // Post-process for numbers and parentheses
    return postProcessSyllables(syllables);
}

/**
 * Segments text respecting granularity rules (spec §3.4)
 * First segments into syllables, then applies merge/split rules
 */
export function segmentWithRules(text: string, rules: GranularityRule[]): string[] {
    const syllables = segmentIntoSyllables(text);
    if (syllables.length === 0 || rules.length === 0) return syllables;

    const activeRules = rules.filter(r => r.enabled);
    if (activeRules.length === 0) return syllables;

    let result = [...syllables];

    for (const rule of activeRules) {
        if (rule.mode === 'merge') {
            result = applyMergeRule(result, rule);
        }
    }

    return result;
}

/**
 * Apply a merge rule — merges specific suffixes/particles with preceding words
 */
function applyMergeRule(syllables: string[], rule: GranularityRule): string[] {
    const patterns = GRAMMAR_PATTERNS[rule.type] || [];
    if (patterns.length === 0) return syllables;

    const result: string[] = [];
    let i = 0;

    while (i < syllables.length) {
        if (rule.type === 'negation') {
            if (syllables[i] === 'မ' && i + 1 < syllables.length) {
                result.push(syllables[i] + syllables[i + 1]);
                i += 2;
                continue;
            }
        } else {
            if (i > 0 && patterns.includes(syllables[i])) {
                result[result.length - 1] = result[result.length - 1] + syllables[i];
                i++;
                continue;
            }
        }
        result.push(syllables[i]);
        i++;
    }

    return result;
}

// --- Utility functions ---

/** Cleans Myanmar text by removing invisible characters and normalizing spaces */
export function cleanText(text: string): string {
    if (!text) return '';
    let cleaned = text;
    cleaned = cleaned.replace(/\u200B/g, '');  // ZWSP
    cleaned = cleaned.replace(/\u200C/g, '');  // ZWNJ
    cleaned = cleaned.replace(/\u200D/g, '');  // ZWJ
    cleaned = cleaned.replace(/\r/g, '');       // carriage returns
    cleaned = cleaned.replace(/  +/g, ' ');     // multiple spaces
    cleaned = cleaned.trim();
    return cleaned;
}

/** Removes all ZWSP characters from text */
export function removeZWSP(text: string): string {
    return text.replace(/\u200B/g, '');
}

/** Normalizes spaces in text */
export function normalizeSpaces(text: string): string {
    return text.replace(/  +/g, ' ').trim();
}

/** Checks if a character is a Myanmar character */
export function isMyanmarChar(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
        (code >= 0x1000 && code <= 0x109F) ||
        (code >= 0xAA60 && code <= 0xAA7F)
    );
}

/** Validates if text contains Myanmar characters */
export function hasMyanmarText(text: string): boolean {
    return Array.from(text).some(char => isMyanmarChar(char));
}

/** Splits text into lines */
export function splitIntoLines(text: string): string[] {
    return text.split(/\n+/).filter(line => line.trim().length > 0);
}

/** Merges segments into a single string with spaces */
export function mergeSegmentTexts(segments: string[]): string {
    return segments.join(' ');
}

/** Re-segments text after editing */
export function resegment(text: string): string[] {
    return segmentIntoSyllables(text);
}

/**
 * Count syllables in a segment to detect under-segmentation
 * A segment with more than 4 syllable-units is likely under-segmented
 */
export function countSyllableUnits(text: string): number {
    return segmentIntoSyllables(text).length;
}

/** Check if a segment is potentially under-segmented */
export function isUnderSegmented(text: string, threshold: number = 4): boolean {
    return countSyllableUnits(text) > threshold;
}

/** Calculate N-gram frequencies from a list of segmented lines */
export function calculateBigramFrequencies(
    lines: { segments: { text: string }[] }[]
): Map<string, number> {
    const freq = new Map<string, number>();
    for (const line of lines) {
        for (let i = 0; i < line.segments.length - 1; i++) {
            const bigram = `${line.segments[i].text}|${line.segments[i + 1].text}`;
            freq.set(bigram, (freq.get(bigram) || 0) + 1);
        }
    }
    return freq;
}

/** Get N-gram merge suggestions above a threshold */
export function getNgramSuggestions(
    lines: { segments: { text: string }[] }[],
    minCount: number = 3
): Array<{ bigram: [string, string]; mergedForm: string; count: number }> {
    const freq = calculateBigramFrequencies(lines);
    const suggestions: Array<{ bigram: [string, string]; mergedForm: string; count: number }> = [];

    for (const [key, count] of freq.entries()) {
        if (count >= minCount) {
            const [a, b] = key.split('|');
            if (hasMyanmarText(a) && hasMyanmarText(b)) {
                suggestions.push({
                    bigram: [a, b],
                    mergedForm: a + b,
                    count,
                });
            }
        }
    }

    return suggestions.sort((a, b) => b.count - a.count);
}
