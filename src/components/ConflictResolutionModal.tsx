'use client';

import React from 'react';
import { useI18n } from '../context/I18nContext';
import { useConflicts } from '../context/ConflictContext';
import { useEditor } from '../context/EditorContext';
import { ConflictInfo, ConflictResolution } from '../types';
import { AlertTriangle, FileText, CheckCircle, AlertCircle, Ban } from 'lucide-react';

interface ConflictResolutionModalProps {
    conflict: ConflictInfo;
    onClose: () => void;
}

export default function ConflictResolutionModal({ conflict, onClose }: ConflictResolutionModalProps) {
    const { t } = useI18n();
    const { resolveConflict } = useConflicts();
    const { setLines, setActiveSegment } = useEditor();

    // Default to form with fewer instances (assume it's the error)
    const [selectedForm, setSelectedForm] = React.useState<'formA' | 'formB'>(
        conflict.locationsA.length < conflict.locationsB.length ? 'formA' : 'formB'
    );

    const handleResolve = (resolution: ConflictResolution) => {
        const updatedLines = resolveConflict(
            conflict.id,
            resolution,
            resolution === 'fix_all' ? selectedForm : undefined
        );
        if (resolution === 'fix_all') {
            setLines(updatedLines);
        }
        onClose();
    };

    const goToLocation = (lineIndex: number, segmentIndex: number) => {
        setActiveSegment(lineIndex, segmentIndex);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-t-2xl">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-white" /> {t('conflictDetected')}
                    </h2>
                    <p className="text-sm mt-1 text-amber-100">
                        &quot;{conflict.word}&quot; {t('conflictWarning')}
                    </p>
                </div>

                {/* Conflict Details */}
                <div className="p-6 space-y-4">
                    {/* Instruction Banner */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                        <div className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                            {selectedForm === 'formA'
                                ? <span className="flex items-center gap-1"><FileText className="w-4 h-4 inline" /> Form A will replace all Form B instances</span>
                                : <span className="flex items-center gap-1"><FileText className="w-4 h-4 inline" /> Form B will replace all Form A instances</span>
                            }
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            {selectedForm === 'formA'
                                ? `${conflict.locationsB.length} instance${conflict.locationsB.length !== 1 ? 's' : ''} will be changed to Form A`
                                : `${conflict.locationsA.length} instance${conflict.locationsA.length !== 1 ? 's' : ''} will be changed to Form B`
                            }
                        </p>
                    </div>
                    {/* Form A */}
                    <div className={`border rounded-xl p-4 transition-all ${selectedForm === 'formA'
                        ? 'border-green-500 dark:border-green-400 ring-2 ring-green-200 dark:ring-green-700/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                        : 'border-blue-200 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10 opacity-75'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    id="form-a-radio"
                                    name="preferred-form"
                                    value="formA"
                                    checked={selectedForm === 'formA'}
                                    onChange={() => setSelectedForm('formA')}
                                    className="w-5 h-5 text-green-600 cursor-pointer accent-green-600"
                                />
                                <label htmlFor="form-a-radio" className="cursor-pointer">
                                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                        Form A: [{conflict.formA.join(' | ')}]
                                    </h3>
                                </label>
                                {selectedForm === 'formA' && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                        ✓ STANDARD
                                    </span>
                                )}
                            </div>
                            {selectedForm === 'formA' && (
                                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300 font-medium">
                                    <span>Form A</span>
                                    <span className="text-lg">→</span>
                                    <span className="line-through opacity-60">Form B</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {conflict.formA.map((seg, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-md text-sm font-medium">
                                    {seg}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {conflict.locationsA.length} {t('occurrences')}
                            {selectedForm === 'formA' && (
                                <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                                    (Will be kept)
                                </span>
                            )}
                        </p>
                        <div className="mt-2 space-y-1">
                            {conflict.locationsA.slice(0, 3).map((loc, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { goToLocation(loc.lineIndex, loc.segmentIndices[0]); onClose(); }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline block"
                                >
                                    → {t('goToLine')} {loc.lineId}: &quot;...{loc.context}...&quot;
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form B */}
                    <div className={`border rounded-xl p-4 transition-all ${selectedForm === 'formB'
                        ? 'border-green-500 dark:border-green-400 ring-2 ring-green-200 dark:ring-green-700/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                        : 'border-purple-200 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10 opacity-75'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    id="form-b-radio"
                                    name="preferred-form"
                                    value="formB"
                                    checked={selectedForm === 'formB'}
                                    onChange={() => setSelectedForm('formB')}
                                    className="w-5 h-5 text-green-600 cursor-pointer accent-green-600"
                                />
                                <label htmlFor="form-b-radio" className="cursor-pointer">
                                    <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                        Form B: [{conflict.formB.join(' | ')}]
                                    </h3>
                                </label>
                                {selectedForm === 'formB' && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                        ✓ STANDARD
                                    </span>
                                )}
                            </div>
                            {selectedForm === 'formB' && (
                                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300 font-medium">
                                    <span>Form B</span>
                                    <span className="text-lg">→</span>
                                    <span className="line-through opacity-60">Form A</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {conflict.formB.map((seg, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-md text-sm font-medium">
                                    {seg}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {conflict.locationsB.length} {t('occurrences')}
                            {selectedForm === 'formB' && (
                                <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                                    (Will be kept)
                                </span>
                            )}
                        </p>
                        <div className="mt-2 space-y-1">
                            {conflict.locationsB.slice(0, 3).map((loc, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { goToLocation(loc.lineIndex, loc.segmentIndices[0]); onClose(); }}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline block"
                                >
                                    → {t('goToLine')} {loc.lineId}: &quot;...{loc.context}...&quot;
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resolution Buttons */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
                    <button
                        onClick={() => handleResolve('fix_all')}
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {t('fixAll')}</span>
                            <span className="text-xs bg-green-600 px-2 py-1 rounded-full">
                                {selectedForm === 'formA'
                                    ? `Apply A → Replace ${conflict.locationsB.length} instance${conflict.locationsB.length !== 1 ? 's' : ''}`
                                    : `Apply B → Replace ${conflict.locationsA.length} instance${conflict.locationsA.length !== 1 ? 's' : ''}`
                                }
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleResolve('exception')}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {t('exception')}</span>
                        <span className="text-xs text-amber-100">{t('exceptionDesc')}</span>
                    </button>

                    <button
                        onClick={() => handleResolve('ignore')}
                        className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2"><Ban className="w-5 h-5" /> {t('ignoreConflict')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('ignoreConflictDesc')}</span>
                    </button>
                </div>

                {/* Cancel */}
                <div className="p-4 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
