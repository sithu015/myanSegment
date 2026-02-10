#!/usr/bin/env node
/**
 * Dictionary Conversion Script
 * Converts Myanmar dictionary data from multiple open-source repositories
 * into the app-compatible JSON format for use in the Word Segmentation Editor.
 * 
 * Sources:
 *   1. myanmar-words-repo (myanmartools) - POS-tagged JSON arrays
 *   2. kanaung-repo - consonant-based wordlists  
 *   3. wordlists collection - categorized phrase files + transliteration
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(BASE_DIR, 'data', 'dictionaries');

// ============================================================
// 1. Process myanmar-words-repo (POS-tagged JSON arrays)
// ============================================================
function processMyanmarWordsRepo() {
    const repoDir = path.join(BASE_DIR, 'myanmar-words-repo', 'json-files');

    const posFiles = [
        { file: 'nouns.json', pos: 'noun' },
        { file: 'verbs.json', pos: 'verb' },
        { file: 'adjectives.json', pos: 'adjective' },
        { file: 'adverbs.json', pos: 'adverb' },
        { file: 'conjunctions.json', pos: 'conjunction' },
        { file: 'particles.json', pos: 'particle' },
        { file: 'postpositions.json', pos: 'postposition' },
        { file: 'pronouns.json', pos: 'pronoun' },
    ];

    const allEntries = [];
    const wordSet = new Set(); // deduplicate

    for (const { file, pos } of posFiles) {
        const filePath = path.join(repoDir, file);
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠ Skipping ${file} (not found)`);
            continue;
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const words = JSON.parse(rawData);

        let added = 0;
        for (const word of words) {
            const trimmed = word.trim();
            if (!trimmed || wordSet.has(`${trimmed}:${pos}`)) continue;

            wordSet.add(`${trimmed}:${pos}`);
            allEntries.push({
                word: trimmed,
                segments: [trimmed], // single word entry
                pos,
            });
            added++;
        }

        console.log(`  ✓ ${file}: ${added} ${pos}s added`);
    }

    return {
        version: '2.0',
        language: 'my',
        name: 'Myanmar Words (POS Tagged)',
        nameMyanmar: 'မြန်မာစကားလုံးများ (ဝါစင်္ဂ)',
        description: 'Myanmar words organized by part of speech from myanmartools',
        category: 'general',
        source: 'myanmartools/myanmar-words',
        license: 'MIT',
        entries: allEntries,
    };
}

// ============================================================
// 2. Process kanaung-repo (consolidated wordlist)
// ============================================================
function processKanaungRepo() {
    const repoDir = path.join(BASE_DIR, 'kanaung-repo');
    const wordlistPath = path.join(repoDir, 'wordlists.list');

    const entries = [];
    const wordSet = new Set();

    if (fs.existsSync(wordlistPath)) {
        const rawData = fs.readFileSync(wordlistPath, 'utf-8');
        const lines = rawData.split('\n');

        for (const line of lines) {
            // Remove BOM and trim
            const word = line.replace(/^\uFEFF/, '').trim();
            if (!word || wordSet.has(word)) continue;

            wordSet.add(word);
            entries.push({
                word,
                segments: [word],
            });
        }

        console.log(`  ✓ wordlists.list: ${entries.length} words added`);
    }

    return {
        version: '2.0',
        language: 'my',
        name: 'Kanaung Wordlist',
        nameMyanmar: 'ကနောင် စကားလုံးစာရင်း',
        description: 'Myanmar word list from Kanaung project for word segmentation',
        category: 'general',
        source: 'kanaung/wordlists',
        license: 'Various',
        entries,
    };
}

// ============================================================
// 3. Process conversation phrases from wordlists collection
// ============================================================
function processConversationPhrases() {
    const classifyDir = path.join(BASE_DIR, 'wordlists', 'myanmar-data', 'classify_data');

    if (!fs.existsSync(classifyDir)) {
        console.log('  ⚠ classify_data directory not found');
        return null;
    }

    const entries = [];
    const wordSet = new Set();
    const files = fs.readdirSync(classifyDir).filter(f => f.endsWith('.txt'));

    for (const file of files) {
        const category = file.replace('.txt', '');
        const filePath = path.join(classifyDir, file);
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const lines = rawData.split('\n');

        let added = 0;
        for (const line of lines) {
            const phrase = line.replace(/^\uFEFF/, '').trim();
            if (!phrase || wordSet.has(phrase)) continue;

            wordSet.add(phrase);
            entries.push({
                word: phrase,
                segments: [phrase],
                domain: category,
            });
            added++;
        }

        if (added > 0) {
            console.log(`  ✓ ${file}: ${added} phrases`);
        }
    }

    return {
        version: '2.0',
        language: 'my',
        name: 'Myanmar Conversation Phrases',
        nameMyanmar: 'မြန်မာ စကားပုံများ',
        description: 'Categorized Myanmar conversation phrases (greetings, requests, etc.)',
        category: 'phrases',
        source: 'chanmratekoko/wordlists',
        license: 'Various',
        entries,
    };
}

// ============================================================
// 4. Process transliteration data
// ============================================================
function processTransliteration() {
    const mm2enPath = path.join(BASE_DIR, 'wordlists', 'myanmar-names', 'mm2en.json');

    if (!fs.existsSync(mm2enPath)) {
        console.log('  ⚠ mm2en.json not found');
        return null;
    }

    const rawData = fs.readFileSync(mm2enPath, 'utf-8');
    const mm2en = JSON.parse(rawData);

    const entries = [];
    for (const [myWord, enWord] of Object.entries(mm2en)) {
        entries.push({
            word: myWord,
            segments: [myWord],
            definition: enWord,
            domain: 'transliteration',
        });
    }

    console.log(`  ✓ mm2en.json: ${entries.length} transliteration entries`);

    return {
        version: '2.0',
        language: 'my',
        name: 'Myanmar-English Transliteration',
        nameMyanmar: 'မြန်မာ-အင်္ဂလိပ် အသံဖလှယ်',
        description: 'Myanmar syllable to English transliteration mapping',
        category: 'transliteration',
        source: 'chanmratekoko/wordlists',
        license: 'Various',
        entries,
    };
}

// ============================================================
// 5. Keep existing legal terms dictionary
// ============================================================
function loadExistingDictionary() {
    const existingPath = path.join(OUTPUT_DIR, 'myanmar_words.json');
    if (!fs.existsSync(existingPath)) {
        console.log('  ⚠ Existing myanmar_words.json not found');
        return null;
    }

    const rawData = fs.readFileSync(existingPath, 'utf-8');
    const existing = JSON.parse(rawData);

    console.log(`  ✓ Existing dictionary: ${existing.entries?.length || 0} entries preserved`);

    return {
        ...existing,
        version: '2.0',
        category: 'legal',
        source: 'custom',
        license: 'CC0-1.0',
    };
}

// ============================================================
// Create index.json
// ============================================================
function createIndex(dictionaries) {
    const index = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalEntries: dictionaries.reduce((sum, d) => sum + (d?.entries?.length || 0), 0),
        dictionaries: dictionaries
            .filter(d => d !== null)
            .map(d => ({
                id: d.category + '-' + d.source.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
                name: d.name,
                nameMyanmar: d.nameMyanmar || '',
                path: getFilename(d),
                category: d.category,
                source: d.source,
                license: d.license,
                entryCount: d.entries.length,
                enabled: true,
            })),
    };

    return index;
}

function getFilename(dict) {
    const map = {
        'myanmartools/myanmar-words': 'myanmar_pos_words.json',
        'kanaung/wordlists': 'kanaung_wordlist.json',
        'chanmratekoko/wordlists': dict.category === 'phrases'
            ? 'conversation_phrases.json'
            : 'transliteration.json',
        'custom': 'myanmar_words.json',
    };
    return map[dict.source] || `dict_${dict.category}.json`;
}

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('🔧 Myanmar Dictionary Conversion Tool\n');
    console.log('═══════════════════════════════════════\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const results = [];

    // 1. Myanmar Words (POS Tagged)
    console.log('📖 Processing Myanmar Words Repository...');
    const posDict = processMyanmarWordsRepo();
    results.push(posDict);
    console.log(`   Total: ${posDict.entries.length} entries\n`);

    // 2. Kanaung Wordlist
    console.log('📖 Processing Kanaung Wordlist...');
    const kanaungDict = processKanaungRepo();
    results.push(kanaungDict);
    console.log(`   Total: ${kanaungDict.entries.length} entries\n`);

    // 3. Conversation Phrases
    console.log('📖 Processing Conversation Phrases...');
    const phrasesDict = processConversationPhrases();
    if (phrasesDict) {
        results.push(phrasesDict);
        console.log(`   Total: ${phrasesDict.entries.length} entries\n`);
    }

    // 4. Transliteration
    console.log('📖 Processing Transliteration Data...');
    const translitDict = processTransliteration();
    if (translitDict) {
        results.push(translitDict);
        console.log(`   Total: ${translitDict.entries.length} entries\n`);
    }

    // 5. Existing Legal Dictionary
    console.log('📖 Loading Existing Legal Dictionary...');
    const legalDict = loadExistingDictionary();
    if (legalDict) {
        results.push(legalDict);
    }
    console.log('');

    // Write all dictionaries
    console.log('═══════════════════════════════════════');
    console.log('💾 Writing dictionary files...\n');

    for (const dict of results) {
        if (!dict) continue;
        const filename = getFilename(dict);
        const outputPath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(outputPath, JSON.stringify(dict, null, 2), 'utf-8');
        console.log(`  ✓ ${filename} (${dict.entries.length} entries, ${(fs.statSync(outputPath).size / 1024).toFixed(1)}KB)`);
    }

    // Write index
    const index = createIndex(results);
    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    console.log(`  ✓ index.json (registry of ${index.dictionaries.length} dictionaries)`);

    // Summary
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Summary\n');
    console.log(`  Total dictionaries: ${index.dictionaries.length}`);
    console.log(`  Total entries:      ${index.totalEntries.toLocaleString()}`);
    console.log(`  Output directory:   ${OUTPUT_DIR}`);
    console.log('\n  Dictionaries:');
    for (const d of index.dictionaries) {
        console.log(`    • ${d.name}: ${d.entryCount.toLocaleString()} entries [${d.category}] (${d.license})`);
    }
    console.log('\n✅ Done!');
}

main().catch(console.error);
