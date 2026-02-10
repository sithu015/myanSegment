# Myanmar Word Segmentation Editor
# မြန်မာစကားလုံး ခွဲခြမ်းစိတ်ဖြာမှု တည်းဖြတ်ကိရိယာ

A specialized annotation tool for creating high-quality Myanmar (Burmese) word segmentation datasets with real-time conflict detection and consistency management.

မြန်မာဘာသာစကားအတွက် အရည်အသွေးမြင့် စကားလုံးခွဲခြမ်းမှု ဒေတာအစုများ ဖန်တီးရာတွင် အထောက်အကူပြုသော အထူးမှတ်သားကိရိယာ။

---

## 🌟 Key Features | အဓိကလုပ်ဆောင်ချက်များ

- **Syllable-based Segmentation** - Accurate Myanmar text processing | တိကျသော မြန်မာစာသား စီမံဆောင်ရွက်မှု
- **Dual Mode System** - Segmentation Mode & Edit Mode | ခွဲခြမ်းမှုစနစ်နှင့် တည်းဖြတ်စနစ်
- **Real-time Conflict Detection** - Maintain consistency across dataset | ဒေတာအစုတစ်လျှောက် တသမတ်တည်းထိန်းသိမ်းခြင်း
- **Smart Auto-correction** - Learn from your annotation patterns | သင့်မှတ်သားပုံစံများမှ သင်ယူခြင်း
- **Bilingual Interface** - Available in English and Myanmar | အင်္ဂလိပ်နှင့် မြန်မာဘာသာဖြင့် ရရှိနိုင်သည်
- **Data Cleaning Tools** - Remove invisible characters, normalize spaces | မမြင်နိုင်သော အက္ခရာများဖယ်ရှားခြင်း

---

## 📚 Documentation | စာရွက်စာတမ်းများ

### User Guides | အသုံးပြုသူလမ်းညွှန်များ
- **[English User Guide](USER_GUIDE.md)** - Complete guide to using the editor
- **[Myanmar User Guide](USER_GUIDE_MM.md)** - မြန်မာဘာသာဖြင့် လမ်းညွှန်ချက်အပြည့်အစုံ

### Design Specifications | ဒီဇိုင်းသတ်မှတ်ချက်များ
- **[Design Specification (English)](Myan_Seg_Editor_Design_Specification_Final.md)** - Detailed technical architecture
- **[Design Specification (Myanmar)](Myan_Seg_Editor_Design_Specification_Final_Burmese.md)** - နည်းပညာဆိုင်ရာ အသေးစိတ်အဆောက်အအုံ

---

## 🚀 Quick Start | အမြန်စတင်ခြင်း

### Installation | ထည့်သွင်းခြင်း

```bash
# Install dependencies | မှီခိုမှုများထည့်သွင်းပါ
npm install
```

### Run Development Server | ဖွံ့ဖြိုးရန်ဆာဗာလည်ပတ်ပါ

```bash
npm run dev
```

### Open in Browser | ဘရောက်ဇာတွင်ဖွင့်ပါ

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 How to Use | အသုံးပြုနည်း

### Basic Workflow | အခြေခံလုပ်ငန်းစဉ်

1. **Import** your Myanmar text file | သင့်မြန်မာစာသားဖိုင်ကို သွင်းယူပါ
2. **Review** the auto-segmented text | အလိုအလျောက်ခွဲခြမ်းထားသော စာသားကို သုံးသပ်ပါ
3. **Edit** segments using keyboard shortcuts | လျင်မြန်သော့များအသုံးပြု၍ အပိုင်းများကို တည်းဖြတ်ပါ
4. **Resolve** conflicts for consistency | တသမတ်တည်းဖြစ်အောင် ပဋိပက္ခများကို ဖြေရှင်းပါ
5. **Export** your annotated dataset | သင့်မှတ်သားထားသော ဒေတာအစုကို ထုတ်ယူပါ

### Essential Keyboard Shortcuts | မရှိမဖြစ်သော့များ

| Shortcut | Action | လုပ်ဆောင်ချက် |
|----------|--------|--------------|
| `Space` | Split segment | အပိုင်းခွဲပါ |
| `Backspace` | Merge segments | အပိုင်းများပေါင်းပါ |
| `F2` | Enter Edit Mode | တည်းဖြတ်စနစ်သို့ဝင်ပါ |
| `Ctrl+Z` | Undo | နောက်ပြန်ဆုတ်ပါ |
| `Ctrl+S` | Save | သိမ်းဆည်းပါ |

---

## 🛠️ Tech Stack | နည်းပညာအစု

- **Framework**: [Next.js 16](https://nextjs.org)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: React 19

---

## 📦 Project Structure | ပရောဂျက်ဖွဲ့စည်းပုံ

```
myanSegment/
├── src/
│   ├── app/           # Next.js app directory
│   ├── components/    # React components
│   ├── context/       # React context (state management)
│   ├── i18n/          # Internationalization
│   ├── lib/           # Utilities and helpers
│   └── types/         # TypeScript type definitions
├── data/              # Sample data files
├── public/            # Static assets
├── scripts/           # Utility scripts
└── ...config files
```

---

## 🎯 Export Format | ထုတ်ယူမှုပုံစံ

Annotated data is exported in JSON format:

```json
{
  "project_meta": {
    "name": "My_Project",
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

---

## 🤝 Contributing | ပံ့ပိုးကူညီခြင်း

Contributions are welcome! Please read the design specifications to understand the architecture before contributing.

ပံ့ပိုးကူညီမှုများကို ကြိုဆိုပါသည်! ပံ့ပိုးမီတွင် အဆောက်အအုံကို နားလည်ရန် ဒီဇိုင်းသတ်မှတ်ချက်များကို ဖတ်ရှုပါ။

---

## 📄 License | လိုင်စင်

This project is released under the **MIT License**.

---

## 💬 Support | အကူအညီ

For issues, questions, or feature requests:
- Check the [User Guides](USER_GUIDE.md) first
- Review the [Design Specifications](Myan_Seg_Editor_Design_Specification_Final.md)
- Open an issue on GitHub

---

## 📜 References & Credits | ရည်ညွှန်းချက်များနှင့် အသိအမှတ်ပြုမှုများ

We gratefully acknowledge the following open-source projects and resources that made this tool possible:

### Core Algorithms | အဓိက အယ်လဂိုရီသမ်များ
- **Sylbreak (Syllable Segmentation)**:
    - Original implementation by **Ye Kyaw Thu**
    - Source: [sylbreak](https://github.com/ye-kyaw-thu/sylbreak)
    - Ported from [myWord](https://github.com/sithu015/myWord) (syl_segment.py)

### Dictionaries & Data | အဘိဓာန်များနှင့် ဒေတာများ
- **Kanaung Project**:
    - Word lists sourced from the **Kanaung** open-source NLP project
    - Used for the primary word segmentation dictionary
- **Myanmar Legal & Common Terms**:
    - Custom-curated dictionary for legal domain support
- **Myanmar POS Words**:
    - Part-of-Speech tagged word lists for grammatical consistency

### Inspiration | စိတ်ကူးစိတ်သန်း
- **myWord**: Comprehensive Myanmar NLP toolkit that served as a reference for segmentation logic.


---

**Happy Annotating! | မှတ်သားခြင်း ပျော်ရွှင်ပါစေ! 🎉**
