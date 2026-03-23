"use client"
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowRight, GripVertical, Footprints, Zap, Code2, HelpCircle, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MoveCondition {
    id: string;
    variable: 'diffX' | 'diffY' | 'absDiffX' | 'absDiffY';
    operator: '===' | '>' | '<' | '>=' | '<=';
    value: number;
    logic?: 'AND' | 'OR';
}

interface MoveRule {
    id: string;
    conditions: MoveCondition[];
    result: 'allow' | 'disallow';
    type?: 'run' | 'jump';
}

interface VisualMoveEditorProps {
    moves: MoveRule[];
    onUpdate: (moves: MoveRule[]) => void;
    pieceId?: string;
    projectId?: string;
}

const VAR_MATH = {
    absDiffX: '|ΔX|',
    absDiffY: '|ΔY|',
    diffX: 'ΔX',
    diffY: 'ΔY',
} as const;

function ExplanationModal({ variable, onClose }: { variable: keyof typeof VAR_MATH, onClose: () => void }) {
    const t = useTranslations('Editor.Piece');
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 font-black text-xl">
                        {VAR_MATH[variable]}
                    </div>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white">{t(`variables.${variable}.label`)}</h3>
                </div>
                <p className="text-stone-500 dark:text-white/60 leading-relaxed mb-8">
                    {t(`variables.${variable}.desc`)}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all"
                >
                    {t('gotIt')}
                </button>
            </motion.div>
        </motion.div>
    );
}

function LogicTutorial({ onClose }: { onClose: () => void }) {
    const t = useTranslations('Editor.Piece');
    
    const patterns = [
        {
            name: 'King',
            desc: 'Moves 1 square in any direction',
            rules: [
                { cond: '|ΔX| ≤ 1', logic: 'AND' },
                { cond: '|ΔY| ≤ 1', logic: 'Allow' }
            ]
        },
        {
            name: 'Rook',
            desc: 'Horizontal or vertical sliding',
            rules: [
                { cond: '|ΔX| = 0', logic: 'OR' },
                { cond: '|ΔY| = 0', logic: 'Allow (Sliding)' }
            ]
        },
        {
            name: 'Bishop',
            desc: 'Diagonal sliding (|ΔX| = |ΔY|)',
            rules: [
                { cond: '|ΔX| = 1', logic: 'AND' },
                { cond: '|ΔY| = 1', logic: 'Allow (Sliding)' },
                { cond: '...', logic: '(Add more for distance)' }
            ]
        },
        {
            name: 'Knight',
            desc: 'Classic L-shape jump',
            rules: [
                { cond: '|ΔX| = 1 AND |ΔY| = 2', logic: 'OR' },
                { cond: '|ΔX| = 2 AND |ΔY| = 1', logic: 'Allow' }
            ]
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                            <HelpCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-stone-900 dark:text-white">Movement Guide</h3>
                            <p className="text-xs text-stone-500 dark:text-white/40 uppercase tracking-widest font-bold">How to recreate standard pieces</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <X size={24} className="text-stone-400" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patterns.map(p => (
                        <div key={p.name} className="p-5 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-black text-stone-900 dark:text-white">{p.name}</h4>
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-md">Template</span>
                            </div>
                            <p className="text-xs text-stone-500 dark:text-white/40 mb-4">{p.desc}</p>
                            <div className="space-y-2">
                                {p.rules.map((r, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                                        <div className="px-2 py-1 bg-white dark:bg-black/40 rounded border border-stone-200 dark:border-white/5 text-stone-700 dark:text-white/80">
                                            {r.cond}
                                        </div>
                                        <ChevronRight size={10} className="text-stone-400" />
                                        <span className="text-stone-400 dark:text-white/30 italic">{r.logic}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <h5 className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Zap size={14} /> Pro Tip
                    </h5>
                    <p className="text-xs text-indigo-200/60 leading-relaxed">
                        Use <strong>"Sliding" (Run)</strong> for pieces that need a clear path, and <strong>"Leaping" (Jump)</strong> for pieces like the Knight that can jump over others.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

function SortableRule({
    rule,
    index,
    onDelete,
    onAddCondition,
    onUpdateCondition,
    onDeleteCondition,
    onToggleResult,
    onToggleType,
    t
}: {
    rule: MoveRule,
    index: number,
    onDelete: (id: string) => void,
    onAddCondition: (id: string) => void,
    onUpdateCondition: (ruleId: string, condId: string, updates: Partial<MoveCondition>) => void,
    onDeleteCondition: (ruleId: string, condId: string) => void,
    onToggleResult: (id: string) => void,
    onToggleType: (id: string) => void,
    t: any
}) {
    const [explaining, setExplaining] = useState<keyof typeof VAR_MATH | null>(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: rule.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-3xl p-6 relative group overflow-hidden mb-4 shadow-sm"
        >
            <AnimatePresence>
                {explaining && <ExplanationModal variable={explaining} onClose={() => setExplaining(null)} />}
            </AnimatePresence>

            {/* Decorative Background Glow */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] pointer-events-none opacity-10 transition-colors ${rule.result === 'allow' ? 'bg-emerald-500' : 'bg-red-500'
                }`} />

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4 min-w-[120px]">
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-2 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 transition-colors"
                    >
                        <GripVertical size={20} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-amber-500/60">
                        {t('rule')} #{index + 1}
                    </span>
                </div>

                <div className="flex-1 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-stone-900/40 dark:text-white/40">{t('if')}</span>

                    {rule.conditions.map((cond, cIdx) => (
                        <div key={cond.id} className="flex items-center gap-2">
                            <div className="flex items-center bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl p-1 gap-1 shadow-sm">
                                <div
                                    className="relative flex items-center"
                                    onClick={() => setExplaining(cond.variable)}
                                >
                                    <select
                                        value={cond.variable}
                                        onChange={(e) => {
                                            onUpdateCondition(rule.id, cond.id, { variable: e.target.value as any });
                                            setExplaining(null);
                                        }}
                                        className="bg-white dark:bg-[#1c1c1c] text-sm font-bold text-amber-500 pl-2 pr-6 py-1 outline-none appearance-none cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 rounded-lg transition-colors border-none"
                                    >
                                        {(Object.keys(VAR_MATH) as Array<keyof typeof VAR_MATH>).map((key) => (
                                            <option key={key} value={key}>{t(`variables.${key}.label`)} ({VAR_MATH[key]})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 pointer-events-none text-amber-500/40">
                                        <Plus size={10} className="rotate-45" />
                                    </div>
                                </div>

                                <select
                                    value={cond.operator}
                                    onChange={(e) => onUpdateCondition(rule.id, cond.id, { operator: e.target.value as any })}
                                    className="bg-white dark:bg-[#1c1c1c] text-sm font-bold text-stone-900/60 dark:text-white/60 px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 rounded-lg transition-colors border-none"
                                >
                                    <option value="===">=</option>
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value=">=">&gt;=</option>
                                    <option value="<=">&lt;=</option>
                                </select>

                                <input
                                    type="number"
                                    value={cond.value}
                                    onChange={(e) => onUpdateCondition(rule.id, cond.id, { value: parseInt(e.target.value) || 0 })}
                                    className="bg-white dark:bg-[#1c1c1c] text-sm font-bold text-stone-900 dark:text-white w-12 px-2 py-1 outline-none text-center hover:bg-stone-50 dark:hover:bg-white/5 rounded-lg transition-colors border-none"
                                />

                                {rule.conditions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteCondition(rule.id, cond.id)}
                                        className="p-1 text-white/20 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                            {cIdx < rule.conditions.length - 1 && (
                                <button
                                    type="button"
                                    onClick={() => onUpdateCondition(rule.id, cond.id, { logic: cond.logic === 'OR' ? 'AND' : 'OR' })}
                                    className="text-[10px] font-black text-amber-500 hover:text-amber-400 px-2 py-1 bg-amber-500/10 rounded-lg transition-all uppercase tracking-widest"
                                >
                                    {cond.logic || 'AND'}
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => onAddCondition(rule.id)}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-95"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <div className="flex items-center gap-4 pl-6 border-l border-white/10 self-stretch">
                    <ArrowRight className="text-white/20" size={20} />

                    <button
                        type="button"
                        onClick={() => onToggleType(rule.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${(rule.type || 'jump') === 'jump'
                            ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                            : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                            }`}
                        title={(rule.type || 'jump') === 'jump' ? "Jumping (Can move over obstacles)" : "Running (Blocked by obstacles)"}
                    >
                        {(rule.type || 'jump') === 'jump' ? <Zap size={14} /> : <Footprints size={14} />}
                        {(rule.type || 'jump') === 'jump' ? 'Jump' : 'Run'}
                    </button>

                    <button
                        type="button"
                        onClick={() => onToggleResult(rule.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${rule.result === 'allow'
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-500 border border-red-500/30'
                            }`}
                    >
                        {rule.result === 'allow' ? t('legal') : t('illegal')}
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(rule.id)}
                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VisualMoveEditor({ moves, onUpdate, pieceId, projectId }: VisualMoveEditorProps) {
    const t = useTranslations('Editor.Piece');
    const locale = useLocale();
    const router = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 0,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = moves.findIndex(m => m.id === active.id);
            const newIndex = moves.findIndex(m => m.id === over.id);
            onUpdate(arrayMove(moves, oldIndex, newIndex));
        }
    };

    const addRule = () => {
        const newRule: MoveRule = {
            id: uuidv4(),
            conditions: [
                { id: uuidv4(), variable: 'absDiffX', operator: '===', value: 1 },
                { id: uuidv4(), variable: 'absDiffY', operator: '===', value: 2 }
            ],
            result: 'allow',
            type: 'jump'
        };
        onUpdate([...moves, newRule]);
    };

    const deleteRule = (ruleId: string) => {
        onUpdate(moves.filter(r => r.id !== ruleId));
    };

    const addCondition = (ruleId: string) => {
        const newMoves = moves.map(rule => {
            if (rule.id === ruleId) {
                return {
                    ...rule,
                    conditions: [
                        ...rule.conditions,
                        { id: uuidv4(), variable: 'absDiffX' as const, operator: '===' as const, value: 0 }
                    ]
                };
            }
            return rule;
        });
        onUpdate(newMoves);
    };

    const updateCondition = (ruleId: string, condId: string, updates: Partial<MoveCondition>) => {
        const newMoves = moves.map(rule => {
            if (rule.id === ruleId) {
                return {
                    ...rule,
                    conditions: rule.conditions.map(c => c.id === condId ? { ...c, ...updates } : c)
                };
            }
            return rule;
        });
        onUpdate(newMoves);
    };

    const deleteCondition = (ruleId: string, condId: string) => {
        const newMoves = moves.map(rule => {
            if (rule.id === ruleId) {
                return {
                    ...rule,
                    conditions: rule.conditions.filter(c => c.id !== condId)
                };
            }
            return rule;
        });
        onUpdate(newMoves);
    };

    const toggleResult = (ruleId: string) => {
        const newMoves = moves.map(rule => {
            if (rule.id === ruleId) {
                return {
                    ...rule,
                    result: (rule.result === 'allow' ? 'disallow' : 'allow') as 'allow' | 'disallow'
                };
            }
            return rule;
        });
        onUpdate(newMoves);
    };

    const toggleType = (ruleId: string) => {
        const newMoves = moves.map(rule => {
            if (rule.id === ruleId) {
                return {
                    ...rule,
                    type: (rule.type === 'run' ? 'jump' : 'run') as 'run' | 'jump'
                };
            }
            return rule;
        });
        onUpdate(newMoves);
    };

    const [showTutorial, setShowTutorial] = useState(false);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
            <AnimatePresence>
                {showTutorial && <LogicTutorial onClose={() => setShowTutorial(false)} />}
            </AnimatePresence>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">{t('visualLogicTitle')}</h2>
                    <p className="text-stone-500 dark:text-white/40 text-sm">{t('visualLogicDescription')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowTutorial(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-100 dark:bg-white/5 text-stone-900 dark:text-white font-black rounded-2xl hover:bg-stone-200 dark:hover:bg-white/10 transition-all border border-stone-200 dark:border-white/10 active:scale-95"
                    >
                        <HelpCircle size={20} className="text-amber-500" /> Guide
                    </button>
                    {pieceId && projectId && (
                        <button
                            type="button"
                            onClick={() => router.push(`/editor/${projectId}/piece-editor/${pieceId}/logic`)}
                            className="flex items-center gap-3 px-8 py-4 bg-linear-to-br from-indigo-500 to-violet-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 transition-all active:scale-95 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Code2 size={22} className="group-hover:rotate-12 transition-transform relative z-10" />
                            <span className="relative z-10 tracking-tight">{t('advancedLogicTitle') || 'Advanced Logic'}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={addRule}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white dark:text-bg font-black rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                        <Plus size={20} /> {t('addRule')}
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={moves.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {moves.map((rule, index) => (
                                <SortableRule
                                    key={rule.id}
                                    rule={rule}
                                    index={index}
                                    onDelete={deleteRule}
                                    onAddCondition={addCondition}
                                    onUpdateCondition={updateCondition}
                                    onDeleteCondition={deleteCondition}
                                    onToggleResult={toggleResult}
                                    onToggleType={toggleType}
                                    t={t}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </SortableContext>
            </DndContext>

            {moves.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl"
                >
                    <p className="text-white/20 font-medium">{t('noRules')}</p>
                    <button
                        type="button"
                        onClick={addRule}
                        className="mt-4 text-amber-500 font-bold hover:underline"
                    >
                        {t('createFirstRule')}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
