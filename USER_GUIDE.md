# Myanmar Word Segmentation Editor - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [Editor Modes](#editor-modes)
5. [Working with Segments](#working-with-segments)
6. [Conflict Detection & Resolution](#conflict-detection--resolution)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Toolbar Functions](#toolbar-functions)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

The Myanmar Word Segmentation Editor is a specialized tool designed to help create high-quality word segmentation datasets for Myanmar (Burmese) language. The editor provides an intuitive interface for annotating text with word boundaries while maintaining consistency across your dataset.

### Key Features
- **Syllable-based segmentation** for accurate Myanmar text processing
- **Real-time conflict detection** to ensure consistency
- **Dual mode system** (Segmentation Mode and Edit Mode)
- **Smart auto-correction** for common patterns
- **Bilingual interface** (English and Myanmar)
- **Data cleaning tools** built-in

---

## Getting Started

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

### Loading Your First Text

1. Click the **Import** button in the toolbar
2. Select a text file containing Myanmar text
3. The editor will automatically apply initial syllable segmentation
4. Begin reviewing and correcting segments

---

## Core Concepts

### Syllables vs Words

The editor works at the **syllable level** as the basic unit:
- **Syllable**: The smallest pronounceable unit (e.g., `မြန်`, `မာ`)
- **Word**: One or more syllables combined (e.g., `မြန်မာ`)

### Segments and Blocks

Text is displayed as **interactive blocks**:
- Each block represents a word segment
- Blocks are visually separated for easy navigation
- The active block shows a blue border

### Conflict Detection

The system automatically detects when the same word is segmented differently:
- Example conflict: `မြန် မာ` vs `မြန်မာ`
- Conflicts are highlighted in yellow
- The sidebar shows conflict warnings

---

## Editor Modes

### Segmentation Mode (Default)

This is your primary working mode for adjusting word boundaries.

**Navigation:**
- Use **Arrow Keys** (← →) to move between segments
- Use **Space** to split a segment at cursor position
- Use **Backspace** to merge with the previous segment

**Visual Indicators:**
- Blue border: Current active segment
- Yellow background: Conflicting segment
- Default background: Normal segment

### Edit Mode

Use this mode to fix spelling errors or modify character-level text.

**Entering Edit Mode:**
- Double-click on any segment
- Or press **F2** while on a segment

**In Edit Mode:**
- Cursor moves character-by-character (like a normal text editor)
- Edit text as needed
- Press **Enter** to save and return to Segmentation Mode
- Press **Esc** to cancel and return without saving

**Important:** After saving edits, the text is automatically re-segmented into syllables.

---

## Working with Segments

### Splitting a Segment

**Example:** Split `မြန်မာနိုင်ငံ` into `မြန်မာ` and `နိုင်ငံ`

1. Click on the segment `မြန်မာနိုင်ငံ`
2. Use arrow keys to position cursor after `မြန်မာ`
3. Press **Space**
4. Result: `[မြန်မာ] [နိုင်ငံ]`

### Merging Segments

**Example:** Merge `မြန် မာ` into `မြန်မာ`

1. Click on the second segment `မာ`
2. Press **Backspace**
3. Result: `[မြန်မာ]`

### Bulk Operations

When you modify a segment, the system can apply changes globally:
1. Make your change (split or merge)
2. If conflicts are detected, a dialog appears
3. Choose:
   - **Fix All**: Apply to all occurrences in the document
   - **This Instance Only**: Keep change local
   - **Cancel**: Undo the change

---

## Conflict Detection & Resolution

### Understanding Conflicts

A conflict occurs when the same text appears with different segmentation:

**Example:**
- Line 5: `ကျောင်း သား` (split)
- Line 42: `ကျောင်းသား` (merged)

### Conflict Dialog Options

When you trigger a conflict, you'll see a dialog with these options:

| Option | When to Use | Effect |
|--------|-------------|--------|
| **Fix All** | The new segmentation is correct for all cases | Updates all occurrences in the document |
| **This Instance Only** | Different contexts require different segmentation | Marks this word as context-dependent |
| **Cancel** | You made a mistake | Reverts your change |

### Conflict Sidebar

The right sidebar shows:
- **Active conflicts** in your document
- **Suggested corrections** based on your previous choices
- **Statistics** on annotation progress

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save progress |
| `Ctrl + Z` | Undo last operation |
| `Ctrl + Shift + Z` | Redo |
| `Ctrl + F` | Find text |

### Segmentation Mode

| Shortcut | Action |
|----------|--------|
| `←` `→` | Navigate between segments |
| `Space` | Split segment at cursor |
| `Backspace` | Merge with previous segment |
| `F2` | Enter Edit Mode |
| `Delete` | Delete current segment |

### Edit Mode

| Shortcut | Action |
|----------|--------|
| `Enter` | Save and exit Edit Mode |
| `Esc` | Cancel and exit Edit Mode |
| `←` `→` | Move cursor character-by-character |

---

## Toolbar Functions

### File Operations

- **Import**: Load raw Myanmar text files
- **Export**: Download segmented dataset (JSON format)
- **Save**: Save current progress

### Cleaning Tools

- **Clean Text**: Remove invisible characters (ZWSP, ZWNJ)
- **Normalize Spaces**: Replace multiple spaces with single space
- **Auto-segment**: Re-run automatic segmentation

### View Options

- **Show Conflicts**: Toggle conflict highlighting
- **Statistics**: View annotation progress
- **Language**: Switch between English and Myanmar UI

### Settings

- **Segmentation Rules**: Configure granularity (word/phrase/syllable level)
- **Auto-save**: Enable/disable automatic saving
- **Theme**: Switch between light and dark modes

---

## Best Practices

### Before You Start

1. **Clean your text first** using the cleaning tools
2. **Review auto-segmentation** - it's usually 80-90% accurate
3. **Start from the beginning** and work systematically

### During Annotation

1. **Use keyboard shortcuts** for faster workflow
2. **Fix conflicts immediately** when they appear
3. **Be consistent** with your segmentation decisions
4. **Save frequently** (or enable auto-save)

### Handling Ambiguous Cases

Some words can be segmented differently based on context:

**Example:** `ပြောကြောင်း`
- As a verb phrase: `ပြော ကြောင်း` (said that)
- As a noun: `ပြောကြောင်း` (what was said)

**Solution:** Use "This Instance Only" in the conflict dialog to mark context-dependent words.

### Quality Control

Periodically check:
- **Conflict count** - aim for zero active conflicts
- **Annotation progress** - shown in the sidebar
- **Consistency** - review your earlier work occasionally

---

## Troubleshooting

### Common Issues

**Q: The editor is slow with large files**
- A: Use the virtualized rendering option in settings
- Large files (>5000 lines) may take time to load

**Q: I accidentally selected "Fix All" on the wrong choice**
- A: Press `Ctrl + Z` immediately to undo
- Check the undo history in the sidebar

**Q: Text appears garbled after import**
- A: Ensure your file is UTF-8 encoded
- Try the "Clean Text" function in the toolbar

**Q: Segments are not splitting where I expect**
- A: The editor uses syllable boundaries
- Use Edit Mode to modify the underlying text if needed

**Q: How do I handle English words in Myanmar text?**
- A: English words are kept as single segments
- You can manually split them if needed in Edit Mode

### Getting Help

- Check the design specification documents for detailed architecture
- Review the FAQ section (coming soon)
- Report bugs via GitHub Issues

---

## Data Format

### Export Format

Segmented data is exported as JSON:

```json
{
  "project_meta": {
    "name": "My_Segmentation_Project",
    "created_at": "2026-02-10",
    "total_lines": 150
  },
  "content": [
    {
      "id": 1,
      "original_text": "မြန်မာနိုင်ငံသားများ",
      "segments": ["မြန်မာ", "နိုင်ငံ", "သား", "များ"],
      "status": "reviewed"
    }
  ]
}
```

### Import Requirements

- **Format**: Plain text (.txt) files
- **Encoding**: UTF-8
- **Content**: Myanmar Unicode text
- **Structure**: One sentence per line (recommended)

---

## Next Steps

Once you're comfortable with the basics:

1. Explore **granularity settings** to customize segmentation rules
2. Try the **N-gram suggestion system** for compound words
3. Set up **project-specific dictionaries** for technical terms
4. Use **export options** to integrate with your NLP pipeline

**Happy Annotating! 🎉**
