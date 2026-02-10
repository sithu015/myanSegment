'use client';

import React, { useEffect, useRef } from 'react';
import { useI18n } from '../context/I18nContext';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAddToDictionary: () => void;
    onSplitHere: () => void;
    onMergeWithPrev: () => void;
    onMarkReviewed: () => void;
    canMerge: boolean;
    isReviewed: boolean;
}

export default function ContextMenu({
    x,
    y,
    onClose,
    onAddToDictionary,
    onSplitHere,
    onMergeWithPrev,
    onMarkReviewed,
    canMerge,
    isReviewed,
}: ContextMenuProps) {
    const { t } = useI18n();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    // Adjust position if near edge
    const style: React.CSSProperties = {
        position: 'fixed',
        left: Math.min(x, window.innerWidth - 220),
        top: Math.min(y, window.innerHeight - 250),
        zIndex: 100,
    };

    const menuItems = [
        {
            icon: '📖',
            label: t('addToDictionary'),
            action: onAddToDictionary,
            shortcut: 'Ctrl+D',
        },
        {
            icon: '✂️',
            label: t('splitHere'),
            action: onSplitHere,
            shortcut: 'Space',
        },
        {
            icon: '🔗',
            label: t('mergeWithPrev'),
            action: canMerge ? onMergeWithPrev : undefined,
            shortcut: 'Backspace',
            disabled: !canMerge,
        },
        { divider: true },
        {
            icon: isReviewed ? '↩️' : '✅',
            label: isReviewed ? 'Unmark Reviewed' : t('markReviewed'),
            action: onMarkReviewed,
        },
    ];

    return (
        <div ref={menuRef} style={style}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] overflow-hidden">
                {menuItems.map((item, idx) => {
                    if ('divider' in item && item.divider) {
                        return <div key={idx} className="border-t border-gray-200 dark:border-gray-700 my-1" />;
                    }
                    const menuItem = item as { icon: string; label: string; action?: () => void; shortcut?: string; disabled?: boolean };
                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                if (menuItem.action) {
                                    menuItem.action();
                                }
                                onClose();
                            }}
                            disabled={menuItem.disabled}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${menuItem.disabled
                                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <span>{menuItem.icon}</span>
                                <span>{menuItem.label}</span>
                            </span>
                            {menuItem.shortcut && (
                                <kbd className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                    {menuItem.shortcut}
                                </kbd>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
