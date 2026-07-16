"use client";

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Zap, Move, BookOpen, HelpCircle } from 'lucide-react';

interface FaqItemProps {
    question: string;
    answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-stone-200 dark:border-white/10 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group transition-all"
            >
                <span className="text-lg font-bold text-stone-800 dark:text-stone-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                    {question}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-400 group-hover:text-orange-500"
                >
                    <ChevronDown size={20} />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function FaqClient() {
    const t = useTranslations('PieceEditorFAQ');

    const sections = [
        {
            id: 'general',
            icon: <BookOpen className="w-6 h-6 text-orange-500" />,
            items: [
                { q: t('sections.general.q1'), a: t('sections.general.a1') },
                { q: t('sections.general.q2'), a: t('sections.general.a2') }
            ]
        },
        {
            id: 'moveEditor',
            icon: <Move className="w-6 h-6 text-blue-500" />,
            items: [
                { q: t('sections.moveEditor.q1'), a: t('sections.moveEditor.a1') },
                { q: t('sections.moveEditor.q2'), a: t('sections.moveEditor.a2') }
            ]
        },
        {
            id: 'logicEditor',
            icon: <Zap className="w-6 h-6 text-purple-500" />,
            items: [
                { q: t('sections.logicEditor.q1'), a: t('sections.logicEditor.a1') },
                { q: t('sections.logicEditor.q2'), a: t('sections.logicEditor.a2') },
                { q: t('sections.logicEditor.q3'), a: t('sections.logicEditor.a3') },
                { q: t('sections.logicEditor.q4'), a: t('sections.logicEditor.a4') }
            ]
        },
        {
            id: 'troubleshooting',
            icon: <HelpCircle className="w-6 h-6 text-emerald-500" />,
            items: [
                { q: t('sections.troubleshooting.q1'), a: t('sections.troubleshooting.a1') },
                { q: t('sections.troubleshooting.q2'), a: t('sections.troubleshooting.a2') }
            ]
        }
    ];

    return (
        <div className="space-y-16">
            {sections.map((section) => (
                <motion.section
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 border border-stone-200 dark:border-white/5 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-stone-100 dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10">
                            {section.icon}
                        </div>
                        <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                            {t(`sections.${section.id}.title`)}
                        </h2>
                    </div>
                    <div className="divide-y divide-stone-100 dark:divide-white/5">
                        {section.items.map((item, idx) => (
                            <FaqItem key={idx} question={item.q} answer={item.a} />
                        ))}
                    </div>
                </motion.section>
            ))}
        </div>
    );
}
