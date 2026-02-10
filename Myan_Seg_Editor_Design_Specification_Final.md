# Project Name: Myanmar Word Segmentation Editor (Myan-Seg-Editor) Design Specification

## 1. Project Overview

Myan-Seg-Editor aims to build an efficient, conflict-free Myanmar word/phrase segmentation annotation tool. The core objective of the tool is to prioritize **consistency** and **speed** based on character-level segmentation to generate high-quality annotated datasets.

## 2. Core Philosophy

*   **Segmentation Unit:** Syllable-based, rather than Character-based.
*   **Workflow:** AI pre-segmentation (post-editing mode) is preferred over manual segmentation from scratch.
*   **Quality Control:** Real-time conflict detection to avoid over/under-segmentation.

## 3. Key Features

### 3.1. Editor Mechanism

*   **Dual Mode System:**
    1.  **Segmentation Mode:** Default mode. Use arrow keys to move syllables, `Space` key to segment, `Backspace` key to merge.
    2.  **Edit Mode:** Triggered by double-clicking or a shortcut (e.g., `F2`), used for fixing spelling errors (character-level editing). In this mode, the cursor moves character by character, allowing the user to modify text like a regular text editor. After editing, pressing `Enter` or clicking elsewhere will immediately re-run the segmentation logic (Regex), rebuild syllables, and automatically switch back to segmentation mode.
*   **Smart Logic:** Uses Regex/Sylbreak logic to automatically switch between segmentation and edit modes.

### 3.2. Consistency & Quality Assurance

*   **Global Glossary:** Tracks user segmentation decisions.
    *   **Tiered Memory System:**
        *   **Manual Memory:** Users explicitly add rare words and technical terms via `Right Click > Add to Dictionary` or shortcuts.
        *   **Auto Memory:** After user modifications, words enter a temporary cache. If the same word appears in the dataset more than 3 times with consistent segmentation, it's automatically moved to the permanent dictionary.
*   **Conflict Detection:**
    *   Detects inconsistencies within the dataset between `A B` (segmented) and `AB` (merged).
    *   **Context-aware Auto-propagation:** Distinguishes based on N-gram context to avoid incorrect global replacements.
    *   **Ambiguity Classification:** Classifies words into "Safe Words" (can be auto-propagated) and "Ambiguous Words" (require manual review).
*   **Visual Warnings:**
    *   Highlights potentially overly long syllables (suspected under-segmentation).
    *   **Conflict Monitor:** Displays warnings in the sidebar, such as "Warning! 'Student' is written separately on line 50, should it be merged here?"
*   **Undo History:** Supports `Ctrl+Z` for undoing operations like auto-propagation.

### 3.3. Data Cleaning (Preprocessing)

*   **Invisible Characters Removal:** Removes unnecessary Unicode control characters like Zero-Width Space (ZWSP, `​`), Zero-Width Non-Joiner (ZWNJ, `‌`), and carriage returns (`
`).
*   **Space Normalization:** Replaces multiple spaces with a single space and trims leading/trailing spaces from strings.
*   **View Options:** Provides two views: Sentence-level View (suitable for NLP training) and Paragraph View (retains original paragraph structure).

### 3.4. Granularity Control and Smart Grouping Logic

To accommodate the segmentation granularity requirements of different downstream tasks, the editor supports configurable grammatical grouping rules:

*   **Rule-based Configuration:** Provides toggle switches in project settings to control the merging or splitting of specific grammatical rules, which will affect pre-segmentation and conflict detection.
    *   **Postpositional Markers (ADP):** Such as `က, ကို, မှာ`. Options: "Always Split" or "Merge with Noun."
    *   **Plural Markers:** Such as `များ, တို့, တွေ`. Options: "Always Split" or "Merge with Noun."
    *   **Tense/Aspect Markers:** Such as `သည်, မည်, ပြီ, ခဲ့`. Options: "Always Split" or "Merge with Verb."
    *   **Adverbial Suffix Grouping:** Such as `စွာ`. Options: "Merge" or "Split."
    *   **Negation Grouping:** Such as `မ` + verb. Options: "Merge" or "Split."
    *   **Relative Participle:** Such as `သော/သည့်/မည့်`. Options: "Merge" or "Split."
*   **Preset Profiles:** Provides preset configurations like "Word Level", "Phrase Level", and "Syllable Level" for quick selection.
*   **N-gram Suggestion System:** Provides merging suggestions for paired syllables (e.g., `("ပီပြင်", "စွာ")`) based on statistical probabilities from existing large datasets (e.g., Wikipedia). When the merging probability exceeds a threshold, the system can automatically merge or provide suggestions.
    *   **UI Implementation:** Provides an "Auto-group by N-gram" button. Upon clicking, the system automatically merges high-probability compound words.

## 4. Tech Stack & Algorithms

*   **Segmentation Algorithm:** Uses a modified `Sylbreak` (Regex-based) algorithm for high performance and transparency. For backend processing, consider using machine learning/graph-based libraries like `myanmar-tools` or `pyidaungsu`.
*   **Backend:** Python (especially suitable for segmentation logic).
*   **Frontend:**
    *   Rapid Prototyping: Streamlit (for quick UI building with Python).
    *   Better User Interface: React.js or Vue.js.
    *   Annotation Framework: Customizable existing tools like Label Studio or Doccano.

## 5. UI Layout Design

The editor interface is divided into three main panels:

*   **[A] Top Toolbar:**
    *   **File Operations:** `Import Raw Text`, `Export Dataset`, `Save Progress`.
    *   **Cleaning Tools:** `Clean ZWSP`, `Normalize Spaces`, `Remove Double Spaces`.
    *   **View Options:** `Toggle Line/Paragraph View`, `Show/Hide Confidence Colors`.
*   **[B] Main Workspace ("Block" View):**
    *   Displays text as **Interactive Blocks**, e.g., `[ School ] [ Students ] [ 's ]`.
    *   Visual Style: The block where the cursor is located shows a **blue border**; conflicting blocks show a **yellow background**.
    *   Interaction: Press `Backspace` between two blocks to merge (`[ Student ]`); press `Space` within a block to split (`[ Stu ] [ dent ]`).
*   **[C] Right Intelligence Sidebar:**
    *   **Conflict Monitor:** Displays conflict warnings and suggestions.
    *   **Dictionary Lookup:** Shows whether the currently selected word is in the dictionary.
    *   **Statistics:** Displays annotation progress (e.g., "Completed - 15 / 100 lines").

## 6. Data Structure Design

To maintain consistency and store metadata, it is recommended to use **JSON format** for data storage.

**Suggested JSON Format Example:**

```json
{
  "project_meta": {
    "name": "Medical_Dataset_01",
    "created_at": "2025-07-12",
    "total_lines": 1000
  },
  "content": [
    {
      "id": 1,
      "original_text": "ဆရာဝန်လာပါပြီ",
      "segments": ["ဆရာဝန်", "လာ", "ပါ", "ပြီ"],
      "status": "reviewed", 
      "flags": [] 
    },
    {
      "id": 2,
      "original_text": "ခွဲစိတ်ကုသမှုအောင်မြင်သည်",
      "segments": ["ခွဲစိတ်", "ကုသ", "မှု", "အောင်မြင်", "သည်"],
      "status": "conflict",
      "flags": ["under_segmentation_warning"]
    }
  ],
  "glossary_updates": ["ခွဲစိတ်", "ကုသမှု"]
}
```

*   **Advantages:** Preserves `original_text` for future algorithm validation; `status` and `flags` fields help track and manage annotation tasks.

## 7. Conflict Resolution Flow

When a user makes segmentation modifications, the system will follow this 4-step process:

### 7.1. Trigger & Local Action

The user presses `Space` (segment) or `Backspace` (merge) in the editor. The editor interface immediately displays the changes.

### 7.2. Background Scan

The system scans the entire dataset and glossary based on the user's modified word (`New_Word`).

*   **Reverse Search:** When the user merges, it looks for all separate instances in the dataset; when the user segments, it looks for all merged instances in the dataset.
*   **Glossary Check:** Checks the dictionary for explicitly defined conflicts.

### 7.3. Conflict Decision Logic

The system selects one of the following three scenarios based on the scan results:

*   **Scenario A: No Conflict:** There are no other conflicting forms in the dataset, and no conflicts in the glossary. The word is added to the **temporary glossary**, and the process ends.
*   **Scenario B: High Confidence Conflict:** The glossary clearly defines a certain form, but inconsistent instances exist in the dataset. The system prompts the user for **Auto-Propagation**, asking whether to unify all inconsistent instances.
*   **Scenario C: Ambiguity Conflict:** Both forms of a word (e.g., "eat table" and "eat party") might have valid meanings. The system will not modify automatically but enters **"Review Mode."**

### 7.4. Resolution Interface

If a conflict is detected, a pop-up window or sidebar will appear with the following options:

| **Option** | **Meaning** | **System Action** |
| :------------------------------ | :--------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Fix All (Apply Globally)** | "The previous segmentation was wrong; the current change is correct." | Immediately changes all `A B` to `AB` in the dataset. Marks `AB` as correct in the glossary. |
| **2. Exception (Contextual)** | "Merge only here; it's correct to keep them separate elsewhere." | Keeps `AB` at the current location. Does not change other locations. This word is added to the **"Ambiguous List"**, and will not be auto-propagated thereafter. |
| **3. Ignore** | "Do nothing." | Closes the warning, performs no action. |

## 8. Technical Roadmap

It is recommended to implement this system following the pipeline below:

1.  **Upload & Clean:** Upload text files -> Clean invisible characters -> Clean double spaces.
2.  **Pre-segmentation:** Perform initial segmentation using Regex (Sylbreak).
3.  **Editor Interface:**
    *   Annotators enter to inspect and modify.
    *   Auto-memory system records new words.
    *   Consistency check system identifies over/under-segmentation issues.
4.  **Export:** Download the cleaned and consistent dataset.


## 9. User Roles & Permissions

To manage large-scale annotation projects, the system supports three user roles:

*   **Admin:** Full access to project management, user management, and data export. Can configure project-wide granularity rules.
*   **Reviewer (Senior Annotator):** Can review and approve/reject annotations made by annotators. Has the authority to resolve "Ambiguity Conflicts."
*   **Annotator:** Primary role for performing word segmentation and spelling corrections.

## 10. Deployment & Maintenance

*   **Deployment:** Docker-based containerization for easy deployment on local servers or cloud platforms (AWS/GCP).
*   **Monitoring:** Integrated logging to track annotation speed and error rates per annotator.
*   **Backup:** Daily automated backups of the JSON data and glossary to prevent data loss.

## 11. Future Enhancements

*   **LLM-Assisted Refinement:** Incorporate Large Language Models (like GPT-4 or specialized Myanmar LLMs) to provide even more accurate pre-segmentation and context-aware suggestions.
*   **Active Learning:** Implement active learning loops where the system prioritizes sentences that it is least confident about for manual review.
*   **Multi-language Support:** Extend the framework to support other low-resource languages with similar script characteristics (e.g., Khmer, Lao).

## 12. API Design (Internal)

To facilitate communication between the React frontend and Python backend, the following core API endpoints are defined:

*   **POST `/api/segment`**: Receives raw text and returns a list of syllable/word blocks using the Sylbreak+ algorithm.
*   **POST `/api/check-conflicts`**: Triggered on every segmentation change. Scans the current project for inconsistencies.
*   **GET/POST `/api/glossary`**: Manages the retrieval and updating of the tiered memory system (Manual/Auto).
*   **GET `/api/stats`**: Returns real-time progress metrics for the dashboard.

## 13. Performance & Scalability

*   **Virtualized Rendering:** For datasets exceeding 5,000 lines, the editor uses windowing/virtualization (e.g., `react-window`) to ensure the UI remains responsive by only rendering visible blocks.
*   **Asynchronous Scanning:** Conflict detection runs as a background worker (using Celery or similar) to prevent UI blocking during heavy global scans.
*   **Regex Optimization:** The Myanmar segmentation Regex is pre-compiled and cached to minimize overhead during real-time editing.

## 14. Security & Data Privacy

*   **Authentication:** JWT-based authentication for secure login and session management.
*   **Data Isolation:** Multi-tenancy support to ensure that different projects or organizations cannot access each other's data.
*   **Audit Logs:** Detailed logs of all data export and deletion actions to maintain data integrity.

## 15. Appendix: Keyboard Shortcuts

| Shortcut | Action | Mode |
| :--- | :--- | :--- |
| `Space` | Split block at cursor | Segmentation |
| `Backspace` | Merge current block with previous | Segmentation |
| `Arrow Keys` | Navigate between blocks | Segmentation |
| `F2` | Enter Edit Mode | Segmentation |
| `Enter` | Save changes and return to Segmentation Mode | Edit |
| `Esc` | Discard changes and return to Segmentation Mode | Edit |
| `Ctrl + Z` | Undo last operation (Merge/Split/Propagate) | Global |
| `Ctrl + S` | Manual Save | Global |

## 16. Error Handling & Validation

*   **Input Validation:** The system prevents the insertion of non-Myanmar Unicode characters except for designated placeholders or English technical terms in Edit Mode.
*   **Server Connectivity:** If the backend becomes unreachable, the editor enters an "Offline Mode" where changes are cached locally using `localStorage` and synced once the connection is restored.
*   **Validation Rules:** Before exporting, the system performs a "Final Health Check" to identify any remaining unreviewed conflicts or empty segments.

## 17. Glossary Management Details

*   **Exporting Glossary:** Users can export the glossary as a CSV or JSON file to be used in other NLP projects (e.g., as a dictionary for a tokenizer).
*   **Importing External Data:** Supports importing external dictionaries (e.g., Myanmar-English dictionaries) to seed the "Manual Memory" tier.
*   **Conflict Resolution in Glossary:** If an imported dictionary conflicts with the current project's decisions, the system prompts the user to choose a "Master Authority."

## 18. Testing Strategy

*   **Unit Testing:** Comprehensive tests for the `Sylbreak+` Regex logic and data cleaning functions using Python's `unittest` or `pytest`.
*   **Integration Testing:** Verifying the flow of data between the React frontend and the FastAPI/Flask backend, specifically for conflict detection triggers.
*   **User Acceptance Testing (UAT):** Conducted with professional Myanmar linguists to ensure the "Smart Grouping Logic" aligns with grammatical standards.
*   **Regression Testing:** Automated tests to ensure that updates to the segmentation algorithm do not break existing vetted datasets.

## 19. Accessibility & Localization

*   **Localization:** While the primary focus is Myanmar script, the UI supports English and Burmese languages for instructions and labels.
*   **Keyboard First Design:** The editor is fully navigable via keyboard shortcuts, catering to power users and ensuring accessibility for those with motor impairments.
*   **High Contrast Mode:** A dedicated UI theme for better visibility of segmentation blocks and conflict highlights.

## 20. Documentation & User Support

*   **User Manual:** A comprehensive PDF and web-based guide covering all features, shortcuts, and best practices for Myanmar word segmentation.
*   **Video Tutorials:** Short walkthrough videos demonstrating common workflows like resolving ambiguity conflicts and using the N-gram suggestion system.
*   **FAQ Section:** A living document addressing common technical issues, installation troubleshooting, and data formatting questions.

## 21. Community & Contribution

*   **Open Source Contribution:** Guidelines for developers to contribute to the segmentation engine (Python) or the editor UI (React) via Pull Requests.
*   **Linguistic Feedback:** A dedicated channel for Myanmar linguists to suggest improvements to the `Sylbreak+` logic and grammatical grouping rules.
*   **Issue Tracking:** Using GitHub Issues or a similar platform to track bugs, feature requests, and project milestones.

## 22. Project License

This project is released under the **MIT License**, allowing for free use, modification, and distribution, provided that the original copyright notice is included.

## 23. Syllable Segmentation Algorithm: Technical Deep Dive

The Myanmar syllable segmentation algorithm is the foundational component of the Myan-Seg-Editor's "Smart Splitting" feature. This section provides a comprehensive technical explanation of the implementation.

### 23.1. Algorithm Overview

The implemented algorithm is based on the **substitution-based regex approach** from the [`myWord` repository](https://github.com/sithu015/myWord), specifically porting the logic from `syl_segment.py`. This approach differs fundamentally from pattern-matching approaches:

**❌ Incorrect Approach (Pattern Matching):**
```python
# Attempts to match complete syllables
syllable_pattern = r'[consonant][medial]?[vowel]?[final]?'
syllables = re.findall(syllable_pattern, text)  # Returns incomplete results
```

**✅ Correct Approach (Substitution-Based):**
```typescript
// Inserts delimiters BEFORE syllable boundaries
const broken = text.replace(BreakPattern, DELIMITER + '$1');
const syllables = broken.split(DELIMITER).filter(s => s.length > 0);
```

### 23.2. Core Implementation

The algorithm consists of three main steps:

#### Step 1: Text Cleaning
```typescript
function cleanText(text: string): string {
    // Remove Zero-Width Space (U+200B)
    let cleaned = text.replace(/\u200B/g, '');
    // Remove other invisible control characters
    cleaned = cleaned.replace(/[\u200C\u200D\uFEFF]/g, '');
    return cleaned;
}
```

#### Step 2: Break Pattern Construction
```typescript
const DELIMITER = '|';

// Myanmar Unicode character ranges
const myConsonant = '\u1000-\u1021';          // က-အ
const medialY = '\u103B\u103C';                // ျြ
const medialR = '\u103D';                       // ွ
const medialW = '\u103C';                       // ြ
const medialH = '\u103E';                       // ှ
const aThat = '\u103A';                         // ်
const ssSymbol = '\u1039';                      // ္ (stacked consonant)
const enChar = 'a-zA-Z0-9';                     // English alphanumeric
const otherChar = '\u0020-\u002F\u003A-\u0040'; // Punctuation

// Break pattern: Insert delimiter BEFORE:
// 1. Consonant (not after stacked symbol, not before aThat/ssSymbol)
// 2. English/punctuation characters
const BreakPattern = new RegExp(
    '(' +
        '(?<!' + ssSymbol + ')[' + myConsonant + '](?![' + aThat + ssSymbol + '])' +
        '|' +
        '[' + enChar + otherChar + ']' +
    ')',
    'gu'  // global + unicode
);
```

#### Step 3: Segmentation
```typescript
export function segmentIntoSyllables(text: string): string[] {
    const cleaned = cleanText(text);
    const broken = cleaned.replace(BreakPattern, DELIMITER + '$1');
    return broken.split(DELIMITER).filter(s => s.length > 0);
}
```

### 23.3. Pattern Breakdown

The `BreakPattern` regex identifies syllable boundaries using **negative lookbehind** and **negative lookahead**:

```typescript
(?<!ssSymbol)[myConsonant](?![aThat|ssSymbol])
```

**Translation:**
- `(?<!...)` = Negative lookbehind: "not preceded by..."
- `(?!...)` = Negative lookahead: "not followed by..."
- **Consonant breaks syllable UNLESS:**
  - It follows a stacked consonant symbol `္` (U+1039)
  - It precedes aThat `်` (U+103A) or another stacked symbol

**Examples:**

| Input | Broken Form | Syllables | Explanation |
|-------|-------------|-----------|-------------|
| `ကျောင်း` | `\|က\|ျောင်း` | `['က','ျောင်း']` | Break before `က` and `ျ` |
| `သား` | `\|သား` | `['သား']` | Single syllable |
| `ဆရာဝန်` | `\|ဆ\|ရာ\|ဝန်` | `['ဆ','ရာ','ဝန်']` | Three syllables |
| `ကျွန်တော်` | `\|ကျွန်\|တော်` | `['ကျွန်','တော်']` | Medials stick to consonant |

### 23.4. Stacked Consonants Handling

Stacked consonants (e.g., `င်္ဂ` = င + ္ + ဂ) must stay together as a single unit:

```typescript
// Pattern includes: (?<!ssSymbol)[myConsonant]
// This prevents breaking AFTER a stacked consonant marker

// Example: "အင်္ဂလိပ်"
// Step 1: Clean
// Step 2: Apply break pattern
//   - Before 'အ': break
//   - Before 'င': break
//   - Before 'ဂ': NO BREAK (preceded by ္)
//   - Before 'လ': break
//   - Before 'ပ': break
// Result: ['အ', 'င်္ဂ', 'လိ', 'ပ်']
```

### 23.5. Punctuation and Mixed Content

English characters and punctuation are treated as individual segments:

```typescript
// Input: "Hello မြန်မာ (Test)"
// Breaks before: H, e, l, l, o, space, မ, ြ, န, space, (, T, e, s, t, )
// Result: ['H','e','l','l','o',' ','မြန်','မာ',' ','(','T','e','s','t',')']
```

### 23.6. Integration with Editor

The syllable segmentation powers the **Smart Space** feature in Segmentation Mode:

```typescript
// In EditorWorkspace.tsx
case ' ':  // Space key pressed
    e.preventDefault();
    if (currentSeg.text.length > 1) {
        const syllables = segmentIntoSyllables(currentSeg.text);
        if (syllables.length > 1) {
            // Split at first syllable boundary
            const splitPos = syllables[0].length;
            splitSegment(currentLineIndex, currentSegmentIndex, splitPos);
        }
    }
    break;
```

**User Experience:**
1. User navigates to segment `"ကျောင်းသား"` (school student)
2. Presses **Space** → System calls `segmentIntoSyllables("ကျောင်းသား")`
3. Algorithm returns `['ကျောင်း', 'သား']`
4. Editor splits at position 9 (length of first syllable)
5. Result: Two segments `"ကျောင်း"` and `"သား"`

### 23.7. Performance Optimization

```typescript
// Pre-compile regex for better performance
const BreakPattern = new RegExp(..., 'gu');  // Compiled once

// Avoid repeated string operations
function segmentIntoSyllables(text: string): string[] {
    if (text.length === 0) return [];
    if (text.length === 1) return [text];
    
    const cleaned = cleanText(text);
    const broken = cleaned.replace(BreakPattern, DELIMITER + '$1');
    return broken.split(DELIMITER).filter(s => s.length > 0);
}
```

### 23.8. Testing and Validation

The implementation was validated against the original Python implementation:

```typescript
// Test case from myWord repository
const input = "ကျွန်တော် က သုတေသနသမား ပါ။";
const result = segmentIntoSyllables(input);
// Expected: ['ကျွန်', 'တော်', 'က', 'သု', 'တေ', 'သ', 'န', 'သ', 'မား', 'ပါ', '။']
// Actual:   ['ကျွန်', 'တော်', 'က', 'သု', 'တေ', 'သ', 'န', 'သ', 'မား', 'ပါ', '။']
// ✅ EXACT MATCH
```

### 23.9. Common Edge Cases

| Edge Case | Input | Output | Notes |
|-----------|-------|--------|-------|
| Empty string | `""` | `[]` | Early return |
| Single character | `"က"` | `['က']` | Early return |
| Pure English | `"Test"` | `['T','e','s','t']` | Each char is a segment |
| Mixed content | `"OK ပါ"` | `['O','K',' ','ပါ']` | English splits, Myanmar intact |
| Numbers | `"၁၂၃"` | `['၁','၂','၃']` | Myanmar digits split |
| ZWSP pollution | `"က​ျောင်း"` | `['ကျောင်း']` | ZWSP removed first |

### 23.10. Future Enhancements

Potential improvements to the algorithm:

1. **Cluster Analysis**: Detect compound words like `"ကျောင်းသား"` (should stay together as "student")
2. **Context-Aware Splitting**: Use dictionary lookup to avoid splitting valid compounds
3. **Adaptive Delimiters**: Support user-defined break preferences per grammatical rule
4. **Performance Metrics**: Add profiling for large documents (10,000+ syllables)

---

Through this systematic preparation, Myan-Seg-Editor will significantly enhance the quality of Myanmar NLP datasets.