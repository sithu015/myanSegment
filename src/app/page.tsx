'use client';

import { useState } from 'react';
import { EditorProvider } from '../context/EditorContext';
import { I18nProvider } from '../context/I18nContext';
import { GlossaryProvider } from '../context/GlossaryContext';
import { ConflictProvider } from '../context/ConflictContext';
import { GranularityProvider } from '../context/GranularityContext';
import Toolbar from '../components/Toolbar';
import EditorWorkspace from '../components/EditorWorkspace';
import Sidebar from '../components/Sidebar';
import HelpModal from '../components/HelpModal';

export default function Home() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isHelpOpen, setHelpOpen] = useState(false);

    return (
        <I18nProvider>
            <EditorProvider>
                <GlossaryProvider>
                    <ConflictProvider>
                        <GranularityProvider>
                            <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                                {/* [A] Top Toolbar - Segdictor */}
                                <Toolbar
                                    toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                                    isSidebarOpen={isSidebarOpen}
                                    onOpenHelp={() => setHelpOpen(true)}
                                />

                                {/* Main content area */}
                                <div className="flex-1 flex overflow-hidden relative">
                                    {/* [B] Main Workspace - Context Area */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <EditorWorkspace />
                                    </div>

                                    {/* [C] Right Intelligence Sidebar - Collapsible */}
                                    <div
                                        className={`transition-all duration-300 ease-in-out border-l border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md ${isSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden border-none'
                                            }`}
                                    >
                                        <div className="w-80 h-full overflow-y-auto">
                                            <Sidebar />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Start / Help Dialog */}
                                {isHelpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
                            </div>
                        </GranularityProvider>
                    </ConflictProvider>
                </GlossaryProvider>
            </EditorProvider>
        </I18nProvider>
    );
}
