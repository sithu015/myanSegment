import React from 'react';
import { X, Keyboard, MousePointer, FileText } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Segdictor အသုံးပြုနည်း
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">၁. ဖိုင်ဖွင့်ပါ</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                'File' မီနူးမှတဆင့် Text ဖိုင်များကို ယူဆောင်ပါ။ ML စနစ်ဖြင့်သော်လည်းကောင်း၊ ရိုးရိုးစနစ်ဖြင့်သော်လည်းကောင်း စတင်နိုင်ပါသည်။
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <Keyboard className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">၂. ဖြတ်တောက်ပါ</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono mx-1">Space</kbd> ဖြင့်ခွဲပါ၊
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono mx-1">Backspace</kbd> ဖြင့်ပြန်ပေါင်းပါ။
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <MousePointer className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">၃. ပြင်ဆင်ပါ</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                စာလုံးပေါင်းပြင်ရန် Double Click နှိပ်ပါ သို့မဟုတ် <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono mx-1">F2</kbd> ကိုနှိပ်ပါ။
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Keyboard Shortcuts</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Undo (ပြန်ပြင်)</span>
                                <kbd className="font-mono text-slate-700 dark:text-slate-300">Ctrl + Z</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Redo (ပြန်လုပ်)</span>
                                <kbd className="font-mono text-slate-700 dark:text-slate-300">Ctrl + Shift + Z</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Save (သိမ်းဆည်း)</span>
                                <kbd className="font-mono text-slate-700 dark:text-slate-300">Ctrl + S</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Navigation</span>
                                <kbd className="font-mono text-slate-700 dark:text-slate-300">Arrow Keys</kbd>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        နားလည်ပါပြီ
                    </button>
                </div>
            </div>
        </div>
    );
}
