'use client';

import { EditorProvider } from '../context/EditorContext';
import { I18nProvider } from '../context/I18nContext';
import { GlossaryProvider } from '../context/GlossaryContext';
import { ConflictProvider } from '../context/ConflictContext';
import { GranularityProvider } from '../context/GranularityContext';
import Toolbar from '../components/Toolbar';
import EditorWorkspace from '../components/EditorWorkspace';
import Sidebar from '../components/Sidebar';

export default function Home() {
    return (
        <I18nProvider>
            <EditorProvider>
                <GlossaryProvider>
                    <ConflictProvider>
                        <GranularityProvider>
                            <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
                                {/* [A] Top Toolbar */}
                                <Toolbar />

                                {/* Main content area */}
                                <div className="flex-1 flex overflow-hidden">
                                    {/* [B] Main Workspace */}
                                    <EditorWorkspace />

                                    {/* [C] Right Intelligence Sidebar */}
                                    <Sidebar />
                                </div>
                            </div>
                        </GranularityProvider>
                    </ConflictProvider>
                </GlossaryProvider>
            </EditorProvider>
        </I18nProvider>
    );
}
