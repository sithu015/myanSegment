'use client';

import React from 'react';
import { Segment } from '../types';

interface SegmentBlockProps {
    segment: Segment;
    lineIndex: number;
    segmentIndex: number;
    showConfidenceColors: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

export default function SegmentBlock({
    segment,
    onClick,
    onDoubleClick,
    onContextMenu,
    showConfidenceColors,
}: SegmentBlockProps) {
    const isActive = segment.isActive;
    const hasConflict = segment.hasConflict;
    const hasWarning = segment.warnings && segment.warnings.length > 0;

    let blockClasses = 'inline-flex items-center px-2.5 py-1.5 rounded-md text-base cursor-pointer select-none transition-all duration-200 myanmar-text ';

    if (isActive) {
        blockClasses += 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-[1.05] ring-2 ring-indigo-400 dark:ring-indigo-500 font-medium ';
    } else if (hasConflict && showConfidenceColors) {
        blockClasses += 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-2 border-amber-300 dark:border-amber-600 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-sm ';
    } else if (hasWarning && showConfidenceColors) {
        blockClasses += 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100 border-2 border-yellow-300 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-sm ';
    } else {
        blockClasses += 'bg-white dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm hover:scale-[1.02] ';
    }

    return (
        <span
            className={blockClasses}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            title={
                hasWarning
                    ? 'Possible under-segmentation'
                    : hasConflict
                        ? 'Inconsistent segmentation detected'
                        : undefined
            }
        >
            {segment.text}
            {hasWarning && showConfidenceColors && (
                <span className="ml-1.5 text-xs text-yellow-600 dark:text-yellow-400">⚠</span>
            )}
        </span>
    );
}
