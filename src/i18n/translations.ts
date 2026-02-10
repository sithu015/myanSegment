/**
 * Internationalization (i18n) translations
 * Bilingual support for English and Myanmar
 */

export interface Translations {
    // Toolbar
    importText: string;
    exportDataset: string;
    saveProgress: string;
    clearWorkspace: string;
    cleanZWSP: string;
    normalizeSpaces: string;
    removeDoubleSpaces: string;

    // View
    lineView: string;
    paragraphView: string;
    showConfidenceColors: string;
    hideConfidenceColors: string;

    // Modes
    segmentationMode: string;
    editMode: string;

    // Undo/Redo
    undoAction: string;
    redoAction: string;

    // Sidebar
    statistics: string;
    linesCompleted: string;
    totalSegments: string;
    conflictMonitor: string;
    dictionaryLookup: string;
    granularitySettings: string;

    // Conflict Resolution
    conflictDetected: string;
    fixAll: string;
    fixAllDesc: string;
    exception: string;
    exceptionDesc: string;
    ignoreConflict: string;
    ignoreConflictDesc: string;
    noConflicts: string;
    conflictWarning: string;
    occurrences: string;
    goToLine: string;

    // Glossary
    addToDictionary: string;
    manualDictionary: string;
    autoDictionary: string;
    wordCount: string;
    ambiguous: string;
    dictionaryEmpty: string;
    notInDictionary: string;
    inDictionary: string;

    // Context Menu
    splitHere: string;
    mergeWithPrev: string;
    markReviewed: string;
    showInConflicts: string;

    // Granularity
    presetSyllable: string;
    presetWord: string;
    presetPhrase: string;
    customRules: string;

    // N-gram
    autoGroupNgram: string;
    ngramSuggestions: string;

    // Actions
    split: string;
    merge: string;
    undo: string;
    save: string;

    // Messages
    welcome: string;
    noContentYet: string;
    importPrompt: string;
    exportSuccess: string;
    saveSuccess: string;
    dataRestored: string;

    // Keyboard shortcuts
    shortcuts: string;
    splitSegment: string;
    mergeSegments: string;
    enterEditMode: string;
    saveShortcut: string;
    undoShortcut: string;
    redoShortcut: string;
    navigateUpDown: string;

    // Status
    ready: string;
    editing: string;
    saved: string;
    unsavedChanges: string;
    reviewed: string;
    pending: string;
    conflict: string;
    linesReviewed: string;
    conflictsFound: string;
}

export type Language = 'en' | 'mm';

export const translations: Record<Language, Translations> = {
    en: {
        importText: 'Import Text',
        exportDataset: 'Export Dataset',
        saveProgress: 'Save Progress',
        clearWorkspace: 'Clear',
        cleanZWSP: 'Clean ZWSP',
        normalizeSpaces: 'Normalize Spaces',
        removeDoubleSpaces: 'Remove Double Spaces',

        lineView: 'Line View',
        paragraphView: 'Paragraph View',
        showConfidenceColors: 'Show Colors',
        hideConfidenceColors: 'Hide Colors',

        segmentationMode: 'Segmentation Mode',
        editMode: 'Edit Mode',

        undoAction: 'Undo',
        redoAction: 'Redo',

        statistics: 'Statistics',
        linesCompleted: 'Lines Completed',
        totalSegments: 'Total Segments',
        conflictMonitor: 'Conflict Monitor',
        dictionaryLookup: 'Dictionary Lookup',
        granularitySettings: 'Granularity Settings',

        conflictDetected: 'Conflict Detected',
        fixAll: 'Fix All (Apply Globally)',
        fixAllDesc: 'Apply this segmentation everywhere',
        exception: 'Exception (Contextual)',
        exceptionDesc: 'Keep both forms as valid',
        ignoreConflict: 'Ignore',
        ignoreConflictDesc: 'Close this warning',
        noConflicts: 'No conflicts detected',
        conflictWarning: 'is segmented differently on',
        occurrences: 'occurrences',
        goToLine: 'Go to line',

        addToDictionary: 'Add to Dictionary',
        manualDictionary: 'Manual Dictionary',
        autoDictionary: 'Auto Dictionary',
        wordCount: 'words',
        ambiguous: 'Ambiguous',
        dictionaryEmpty: 'Dictionary is empty',
        notInDictionary: 'Not in dictionary',
        inDictionary: 'In dictionary',

        splitHere: 'Split Here',
        mergeWithPrev: 'Merge with Previous',
        markReviewed: 'Mark as Reviewed',
        showInConflicts: 'Show in Conflict Monitor',

        presetSyllable: 'Syllable Level',
        presetWord: 'Word Level',
        presetPhrase: 'Phrase Level',
        customRules: 'Custom Rules',

        autoGroupNgram: 'Auto-group by N-gram',
        ngramSuggestions: 'N-gram Suggestions',

        split: 'Split',
        merge: 'Merge',
        undo: 'Undo',
        save: 'Save',

        welcome: 'Myanmar Word Segmentation Editor',
        noContentYet: 'No content yet. Import a text file to get started.',
        importPrompt: 'Click "Import Text" to load Myanmar text',
        exportSuccess: 'Dataset exported successfully!',
        saveSuccess: 'Progress saved successfully!',
        dataRestored: 'Previous session restored',

        shortcuts: 'Keyboard Shortcuts',
        splitSegment: 'Split segment',
        mergeSegments: 'Merge segments',
        enterEditMode: 'Edit mode',
        saveShortcut: 'Save',
        undoShortcut: 'Undo',
        redoShortcut: 'Redo',
        navigateUpDown: 'Navigate lines',

        ready: 'Ready',
        editing: 'Editing',
        saved: 'Saved',
        unsavedChanges: 'Unsaved changes',
        reviewed: 'Reviewed',
        pending: 'Pending',
        conflict: 'Conflict',
        linesReviewed: 'lines reviewed',
        conflictsFound: 'conflicts found',
    },

    mm: {
        importText: 'စာသားသွင်းယူရန်',
        exportDataset: 'ဒေတာအစု ထုတ်ယူရန်',
        saveProgress: 'တိုးတက်မှု သိမ်းဆည်းရန်',
        clearWorkspace: 'ရှင်းလင်းရန်',
        cleanZWSP: 'ZWSP ရှင်းလင်းရန်',
        normalizeSpaces: 'အကွက်လပ် စံချိန်သတ်မှတ်ရန်',
        removeDoubleSpaces: 'နှစ်ထပ်အကွက်လပ် ဖယ်ရှားရန်',

        lineView: 'စာကြောင်းပုံစံ',
        paragraphView: 'စာပိုဒ်ပုံစံ',
        showConfidenceColors: 'အရောင်ပြ',
        hideConfidenceColors: 'အရောင်ဖျောက်',

        segmentationMode: 'ခွဲခြမ်းမှု စနစ်',
        editMode: 'တည်းဖြတ်မှု စနစ်',

        undoAction: 'နောက်ပြန်ဆုတ်',
        redoAction: 'ပြန်လုပ်',

        statistics: 'စာရင်းအင်း',
        linesCompleted: 'ပြီးစီးသော လိုင်းများ',
        totalSegments: 'စုစုပေါင်း အပိုင်းများ',
        conflictMonitor: 'ပဋိပက္ခ စောင့်ကြည့်မှု',
        dictionaryLookup: 'အဘိဓာန် ရှာဖွေမှု',
        granularitySettings: 'အသေးစိတ် ဆက်တင်များ',

        conflictDetected: 'ပဋိပက္ခ တွေ့ရှိသည်',
        fixAll: 'အားလုံး ပြင်ဆင်ရန်',
        fixAllDesc: 'ဤခွဲခြမ်းပုံကို နေရာတိုင်း အသုံးချရန်',
        exception: 'ခြွင်းချက် (အခြေအနေအလိုက်)',
        exceptionDesc: 'နှစ်မျိုးလုံးကို မှန်ကန်အဖြစ် ထားရှိရန်',
        ignoreConflict: 'လျစ်လျူရှုရန်',
        ignoreConflictDesc: 'ဤသတိပေးချက်ကို ပိတ်ရန်',
        noConflicts: 'ပဋိပက္ခ မတွေ့ပါ',
        conflictWarning: 'တွင် ကွဲပြားစွာ ခွဲခြမ်းထားသည်',
        occurrences: 'ကြိမ်',
        goToLine: 'စာကြောင်းသို့ သွားရန်',

        addToDictionary: 'အဘိဓာန်သို့ ထည့်ရန်',
        manualDictionary: 'ကိုယ်ပိုင် အဘိဓာန်',
        autoDictionary: 'အလိုအလျောက် အဘိဓာန်',
        wordCount: 'စကားလုံး',
        ambiguous: 'မရှင်းလင်း',
        dictionaryEmpty: 'အဘိဓာန် ဗလာဖြစ်နေသည်',
        notInDictionary: 'အဘိဓာန်တွင် မရှိ',
        inDictionary: 'အဘိဓာန်တွင် ရှိ',

        splitHere: 'ဤနေရာတွင် ခွဲရန်',
        mergeWithPrev: 'ရှေ့နှင့် ပေါင်းရန်',
        markReviewed: 'ပြန်လည်သုံးသပ်ပြီး အဖြစ် မှတ်ရန်',
        showInConflicts: 'ပဋိပက္ခတွင် ပြရန်',

        presetSyllable: 'ဝဏ္ဏအဆင့်',
        presetWord: 'စကားလုံးအဆင့်',
        presetPhrase: 'စကားစုအဆင့်',
        customRules: 'စိတ်ကြိုက် စည်းမျဉ်းများ',

        autoGroupNgram: 'N-gram ဖြင့် အလိုအလျောက် စုစည်း',
        ngramSuggestions: 'N-gram အကြံပြုချက်များ',

        split: 'ခွဲခြမ်းရန်',
        merge: 'ပေါင်းစပ်ရန်',
        undo: 'နောက်ပြန်ဆုတ်ရန်',
        save: 'သိမ်းဆည်းရန်',

        welcome: 'မြန်မာစကားလုံး ခွဲခြမ်းစိတ်ဖြာမှု တည်းဖြတ်ကိရိယာ',
        noContentYet: 'အကြောင်းအရာ မရှိသေးပါ။ စတင်ရန် စာသားဖိုင်ကို သွင်းယူပါ။',
        importPrompt: 'မြန်မာစာသား တင်ရန် "စာသားသွင်းယူရန်" ကို နှိပ်ပါ',
        exportSuccess: 'ဒေတာအစု ထုတ်ယူမှု အောင်မြင်ပါသည်!',
        saveSuccess: 'တိုးတက်မှု သိမ်းဆည်းမှု အောင်မြင်ပါသည်!',
        dataRestored: 'ယခင်သင်ခန်းစာ ပြန်လည်ရယူပြီး',

        shortcuts: 'လျင်မြန်သော့များ',
        splitSegment: 'အပိုင်းခွဲရန်',
        mergeSegments: 'အပိုင်းများ ပေါင်းရန်',
        enterEditMode: 'တည်းဖြတ်မှု စနစ်',
        saveShortcut: 'သိမ်းဆည်းရန်',
        undoShortcut: 'နောက်ပြန်ဆုတ်ရန်',
        redoShortcut: 'ပြန်လုပ်ရန်',
        navigateUpDown: 'စာကြောင်းများ ရွေ့ရန်',

        ready: 'အသင့်ဖြစ်နေသည်',
        editing: 'တည်းဖြတ်နေသည်',
        saved: 'သိမ်းဆည်းပြီး',
        unsavedChanges: 'မသိမ်းဆည်းရသေး',
        reviewed: 'ပြန်လည်သုံးသပ်ပြီး',
        pending: 'ဆိုင်းငံ့',
        conflict: 'ပဋိပက္ခ',
        linesReviewed: 'စာကြောင်း စစ်ဆေးပြီး',
        conflictsFound: 'ပဋိပက္ခ တွေ့ရှိ',
    },
};

export function t(key: keyof Translations, lang: Language): string {
    return translations[lang][key];
}
