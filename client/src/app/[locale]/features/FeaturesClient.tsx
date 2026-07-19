"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Bug, Lightbulb, MessageCircle, Send, CheckCircle, Check } from "lucide-react";
import * as motion from "framer-motion/client";

interface Feature {
    id: string;
    date: string;
    title: string;
    description: string;
    done: boolean;
    order: number;
}

type FeedbackType = "bug" | "feature" | "general" | null;

const defaultFeatures: Feature[] = [
    { id: "1", date: "2026-01-15", title: "Custom piece logic engine", description: "Define move rules with a visual editor", done: true, order: 1 },
    { id: "2", date: "2026-02-01", title: "Non-grid board support", description: "Create boards with irregular square layouts", done: true, order: 2 },
    { id: "3", date: "2026-03-10", title: "Multiplayer online play", description: "Play custom variants with friends in real-time", done: true, order: 3 },
    { id: "4", date: "2026-04-20", title: "Marketplace for community variants", description: "Share and discover community-created boards and piece sets", done: true, order: 4 },
    { id: "5", date: "2026-05-15", title: "AI opponent for custom variants", description: "Play against AI that understands custom rules", done: true, order: 5 },
    { id: "6", date: "2026-06-01", title: "Supabase migration", description: "Migrate from Firestore to Supabase for better scalability", done: true, order: 6 },
    { id: "7", date: "2026-07-01", title: "Enhanced creator tools", description: "Advanced analytics and promotion tools for creators", done: false, order: 7 },
    { id: "8", date: "2026-08-01", title: "Tournament system", description: "Organize and participate in chess variant tournaments", done: false, order: 8 },
];

function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().slice(0, 10);
}

function isPast(dateStr: string): boolean {
    return dateStr < new Date().toISOString().slice(0, 10);
}

function groupByDate(features: Feature[]): Map<string, Feature[]> {
    const map = new Map<string, Feature[]>();
    for (const f of features) {
        const existing = map.get(f.date) ?? [];
        map.set(f.date, [...existing, f]);
    }
    for (const [date, group] of map) {
        map.set(date, group.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }
    return map;
}

export default function FeaturesClient() {
    const t = useTranslations("Features");
    const [features] = useState<Feature[]>(defaultFeatures);

    const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [feedbackError, setFeedbackError] = useState("");

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLDivElement>(null);

    const grouped = groupByDate(features);
    const sortedDates = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedbackError("");
        try {
            const res = await fetch("/api/community-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: feedbackType, message, email }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Failed to submit");
            }
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setFeedbackType(null);
                setMessage("");
                setEmail("");
            }, 3500);
        } catch (err: unknown) {
            setFeedbackError(err instanceof Error ? err.message : t("feedback.error"));
        } finally {
            setSubmitting(false);
        }
    };

    const feedbackOptions = [
        {
            type: "bug" as const,
            icon: <Bug className="w-5 h-5" />,
            label: t("feedback.bug"),
            color: "text-red-500 dark:text-red-400",
            ring: "ring-red-400/40 hover:ring-red-400",
        },
        {
            type: "feature" as const,
            icon: <Lightbulb className="w-5 h-5" />,
            label: t("feedback.feature"),
            color: "text-amber-500 dark:text-amber-400",
            ring: "ring-amber-400/40 hover:ring-amber-400",
        },
        {
            type: "general" as const,
            icon: <MessageCircle className="w-5 h-5" />,
            label: t("feedback.general"),
            color: "text-blue-500 dark:text-blue-400",
            ring: "ring-blue-400/40 hover:ring-blue-400",
        },
    ];

    return (
        <main className="grow bg-bg dark:bg-stone-950 min-h-screen">
            <section className="mx-auto max-w-2xl px-6 pt-12 pb-4">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors mb-8"
                >
                    ← Chessperiment
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 mb-1">
                        {t("title")}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 text-sm mb-10">
                        {t("subtitle")}
                    </p>
                </motion.div>

                {sortedDates.length === 0 ? (
                    <p className="text-stone-400 dark:text-stone-500 text-sm py-8">{t("empty")}</p>
                ) : (
                    <div
                        ref={scrollContainerRef}
                        className="relative overflow-y-auto max-h-[calc(100vh-16rem)] pr-1"
                    >
                        <div className="absolute left-[5px] top-2 bottom-0 w-px bg-stone-200 dark:bg-stone-800" />

                        <div className="space-y-0">
                            {sortedDates.map((date, dateIndex) => {
                                const dayFeatures = grouped.get(date)!;
                                const past = isPast(date);
                                const today = isToday(date);
                                const allDone = dayFeatures.every((f) => f.done);

                                return (
                                    <motion.div
                                        key={date}
                                        ref={today ? todayRef : undefined}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: dateIndex * 0.05 }}
                                        className="flex gap-4"
                                    >
                                        <div className="flex flex-col items-center shrink-0 mt-1.5">
                                            {allDone ? (
                                                <div className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center z-10">
                                                    <Check className="w-2 h-2 text-white stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className={`w-3 h-3 rounded-full border-2 z-10 ${today ? "border-amber-500 bg-amber-500/20" : past ? "border-stone-400 dark:border-stone-600 bg-bg dark:bg-stone-950" : "border-amber-400 bg-bg dark:bg-stone-950"}`} />
                                            )}
                                        </div>

                                        <div className={`pb-8 flex-1 ${past && !today ? "opacity-50" : ""}`}>
                                            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${today ? "text-amber-500 dark:text-amber-400" : past ? "text-stone-400 dark:text-stone-600" : "text-stone-500 dark:text-stone-400"}`}>
                                                {today ? `${t("today")} · ${formatDate(date)}` : formatDate(date)}
                                            </p>

                                            {dayFeatures.map((feature) => (
                                                <div key={feature.id} className="mb-3 last:mb-0">
                                                    <div className="flex items-center gap-2">
                                                        {feature.done && (
                                                            <Check className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400" />
                                                        )}
                                                        <h3 className={`font-semibold text-base leading-snug ${feature.done ? "text-stone-400 dark:text-stone-600 line-through" : past && !today ? "text-stone-500 dark:text-stone-500" : "text-stone-900 dark:text-stone-100"}`}>
                                                            {feature.title}
                                                        </h3>
                                                    </div>
                                                    <p className={`text-sm mt-0.5 leading-relaxed ${past && !today ? "text-stone-400 dark:text-stone-600" : "text-stone-500 dark:text-stone-400"}`}>
                                                        {feature.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* Community Feedback */}
            <section className="mx-auto max-w-2xl px-6 pt-8 pb-20">
                <div className="border-t border-stone-200 dark:border-stone-800 pt-10">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                        {t("feedback.title")}
                    </h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                        {t("feedback.subtitle")}
                    </p>

                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 py-4 px-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                        >
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                {t("feedback.thanks")}
                            </p>
                        </motion.div>
                    ) : feedbackType === null ? (
                        <div className="flex flex-wrap gap-2">
                            {feedbackOptions.map((opt) => (
                                <button
                                    key={opt.type}
                                    onClick={() => setFeedbackType(opt.type)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ring-1 bg-white dark:bg-stone-900 transition-all ${opt.color} ${opt.ring}`}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleFeedbackSubmit}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center gap-2 text-sm font-medium ${feedbackOptions.find((o) => o.type === feedbackType)?.color}`}>
                                    {feedbackOptions.find((o) => o.type === feedbackType)?.icon}
                                    {feedbackOptions.find((o) => o.type === feedbackType)?.label}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { setFeedbackType(null); setFeedbackError(""); }}
                                    className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                                >
                                    {t("feedback.cancel")}
                                </button>
                            </div>

                            {feedbackError && (
                                <p className="text-sm text-red-500 dark:text-red-400">{feedbackError}</p>
                            )}

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                minLength={5}
                                maxLength={2000}
                                rows={4}
                                placeholder={t("feedback.messagePlaceholder")}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none resize-none transition-all"
                            />

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t("feedback.emailPlaceholder")}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                            />

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {t("feedback.submit")}
                            </button>
                        </motion.form>
                    )}
                </div>
            </section>
        </main>
    );
}
