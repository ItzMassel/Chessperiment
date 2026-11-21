'use client';

import React from 'react';

/**
 * Presentational pieces for the "bench": the tray where pieces wait that are
 * not on the board yet. The editor and the play board both use these, and each
 * decides what a click or drag on a slot means.
 */

interface BenchTrayProps {
    label: string;
    color: 'white' | 'black';
    count: string;
    children: React.ReactNode;
    /** Shown instead of the slots while the bench is empty. */
    emptyText?: string;
    /** Extra controls on the right of the header (e.g. a "clear" button). */
    actions?: React.ReactNode;
    className?: string;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

export function BenchTray({ label, color, count, children, emptyText, actions, className = '', onDragOver, onDrop }: BenchTrayProps) {
    const hasChildren = React.Children.count(children) > 0;
    return (
        <div
            data-bench-tray={color}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`rounded-2xl border border-stone-200 dark:border-white/10 bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm px-3 py-2 ${className}`}
        >
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className={`w-2.5 h-2.5 rounded-full border shrink-0 ${color === 'white' ? 'bg-white border-stone-400' : 'bg-stone-800 border-stone-600'}`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 truncate">{label}</span>
                    <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 tabular-nums">{count}</span>
                </div>
                {actions}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem]">
                {children}
                {!hasChildren && emptyText && (
                    <span className="text-[11px] italic text-stone-400 dark:text-stone-500 px-1">{emptyText}</span>
                )}
            </div>
        </div>
    );
}

interface BenchSlotProps {
    size: number;
    title?: string;
    selected?: boolean;
    disabled?: boolean;
    dragging?: boolean;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    /** Small control shown in the corner on hover (e.g. a remove button). */
    corner?: React.ReactNode;
    children: React.ReactNode;
}

export const BenchSlot = React.forwardRef<HTMLDivElement, BenchSlotProps & React.HTMLAttributes<HTMLDivElement>>(function BenchSlot(
    { size, title, selected, disabled, dragging, onClick, onContextMenu, corner, children, className = '', style, onKeyDown, ...rest },
    ref,
) {
    return (
        <div
            // Extra props (e.g. drag handles from dnd-kit) come first so the state below always wins.
            {...rest}
            ref={ref}
            role={onClick ? 'button' : undefined}
            aria-pressed={onClick ? !!selected : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={onClick && !disabled ? 0 : undefined}
            title={title}
            onClick={disabled ? undefined : onClick}
            onKeyDown={(e) => {
                onKeyDown?.(e);
                if (disabled || !onClick || e.defaultPrevented) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            onContextMenu={onContextMenu}
            style={{ width: size, height: size, ...style }}
            className={`group relative flex items-center justify-center rounded-xl border transition-all select-none
                ${selected ? 'border-amber-400 bg-amber-400/20 ring-2 ring-amber-400' : 'border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-white/5'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:bg-stone-200 dark:hover:bg-white/10' : ''}
                ${dragging ? 'opacity-30' : ''} ${className}`}
        >
            {children}
            {corner}
        </div>
    );
});
