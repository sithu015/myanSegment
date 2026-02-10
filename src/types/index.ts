/**
 * TypeScript type definitions for Myanmar Word Segmentation Editor
 */

// Editor mode types
export type EditorMode = 'segmentation' | 'edit';

// View mode types
export type ViewMode = 'line' | 'paragraph';

// Language options for i18n
export type Language = 'en' | 'mm';

// Granularity preset profiles
export type GranularityPreset = 'word' | 'phrase' | 'syllable';

// Conflict resolution options (spec §7.4)
export type ConflictResolution = 'fix_all' | 'exception' | 'ignore';

// Individual segment (syllable or word)
export interface Segment {
    id: string;
    text: string;
    isActive?: boolean;
    hasConflict?: boolean;
    cursorPosition?: number; // For edit mode — cursor position within the segment
    warnings?: SegmentWarning[]; // Under-segmentation etc.
}

export type SegmentWarning = 'under_segmentation' | 'long_syllable';

// Line containing multiple segments
export interface Line {
    id: number;
    originalText: string;
    segments: Segment[];
    status: 'pending' | 'reviewed' | 'conflict';
    flags?: string[];
}

// Project metadata
export interface ProjectMeta {
    name: string;
    createdAt: string;
    totalLines: number;
    lastModified?: string;
}

// Complete project data structure (matches JSON export format from spec §6)
export interface ProjectData {
    projectMeta: ProjectMeta;
    content: Line[];
    glossaryUpdates?: string[];
}

// Editor state
export interface EditorState {
    lines: Line[];
    currentLineIndex: number;
    currentSegmentIndex: number;
    mode: EditorMode;
    viewMode: ViewMode;
    hasUnsavedChanges: boolean;
}

// --- Conflict Detection (spec §3.2, §7) ---
export type ConflictType = 'under_segmentation' | 'over_segmentation' | 'inconsistent_segmentation';

export interface ConflictLocation {
    lineId: number;
    lineIndex: number;
    segmentIndices: number[]; // Which segments form the word
    context: string; // surrounding text for display
}

export interface ConflictInfo {
    id: string;
    word: string; // The word in question e.g. "ကျောင်းသား"
    formA: string[]; // One segmentation form e.g. ["ကျောင်း", "သား"]
    formB: string[]; // Alternative form e.g. ["ကျောင်းသား"]
    locationsA: ConflictLocation[]; // All locations of form A
    locationsB: ConflictLocation[]; // All locations of form B
    type: ConflictType;
    resolved: boolean;
    resolution?: ConflictResolution;
}

// --- Glossary (spec §3.2, §17) ---
export type GlossarySource = 'manual' | 'auto';

export interface GlossaryEntry {
    word: string;
    segments: string[];
    source: GlossarySource;
    count: number; // Number of times encountered
    addedAt: string; // ISO date
    isAmbiguous: boolean; // Part of "Ambiguous List" per spec §7.4
}

export interface Glossary {
    manual: GlossaryEntry[];
    auto: GlossaryEntry[];
}

// --- Undo/Redo (spec §3.2, §15) ---
export interface UndoEntry {
    lines: Line[];
    description: string; // e.g. "Split segment on line 5"
    timestamp: number;
}

// Legacy action type (kept for compatibility)
export interface EditorAction {
    type: 'split' | 'merge' | 'edit' | 'delete' | 'insert' | 'propagate';
    lineIndex: number;
    segmentIndex: number;
    previousState: Segment[];
    newState: Segment[];
    timestamp: number;
}

// --- Granularity Control (spec §3.4) ---
export type GranularityRuleType =
    | 'adp'        // Postpositional Markers (က, ကို, မှာ)
    | 'plural'     // Plural Markers (များ, တို့, တွေ)
    | 'tense'      // Tense/Aspect Markers (သည်, မည်, ပြီ, ခဲ့)
    | 'adverbial'  // Adverbial Suffix (စွာ)
    | 'negation'   // Negation (မ + verb)
    | 'participle'; // Relative Participle (သော, သည့်, မည့်)

export type GranularityRuleMode = 'split' | 'merge';

export interface GranularityRule {
    type: GranularityRuleType;
    label: string;
    labelMm: string;
    examples: string[];
    mode: GranularityRuleMode;
    enabled: boolean;
}

// --- N-gram (spec §3.4) ---
export interface NgramSuggestion {
    bigram: [string, string];
    mergedForm: string;
    probability: number;
    count: number;
}
