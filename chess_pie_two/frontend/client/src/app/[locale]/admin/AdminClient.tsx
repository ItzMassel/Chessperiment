"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Check, Trash2, Edit2, Plus, LogOut, Bug, Lightbulb,
    MessageCircle, Eye, CheckCircle, X, Lock, ChevronDown, ChevronUp
} from "lucide-react";
import * as motion from "framer-motion/client";

interface Feature {
    id: string;
    date: string;
    title: string;
    description: string;
    done: boolean;
    order: number;
}

interface FeedbackItem {
    id: string;
    type: "bug" | "feature" | "general";
    message: string;
    email: string;
    status: "new" | "seen" | "resolved";
    createdAt: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
}

function isPast(dateStr: string) {
    return dateStr < TODAY;
}

function groupByDate(features: Feature[]) {
    const map = new Map<string, Feature[]>();
    for (const f of features) {
        map.set(f.date, [...(map.get(f.date) ?? []), f]);
    }
    return map;
}

// ─── Login Form ──────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Invalid password");
                return;
            }
            setPassword("");
            onSuccess();
        } catch {
            setError("Network error. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg dark:bg-stone-950 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="flex items-center justify-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-amber-500" />
                    </div>
                </div>
                <h1 className="text-2xl font-black text-center text-stone-900 dark:text-stone-100 mb-1">
                    Admin Access
                </h1>
                <p className="text-sm text-center text-stone-500 dark:text-stone-400 mb-8">
                    Chessperiment · Restricted Area
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Verifying…
                            </span>
                        ) : "Sign In"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Feature Form ─────────────────────────────────────────────────────────────

function FeatureForm({
    initial,
    onSave,
    onCancel,
}: {
    initial?: Partial<Feature>;
    onSave: (data: Omit<Feature, "id">) => Promise<void>;
    onCancel: () => void;
}) {
    const [date, setDate] = useState(initial?.date ?? TODAY);
    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [order, setOrder] = useState(initial?.order ?? 0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await onSave({ date, title, description, done: initial?.done ?? false, order });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-700">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-bg dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 outline-none"
                    />
                </div>
                <div className="w-20">
                    <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Order</label>
                    <input
                        type="number"
                        value={order}
                        onChange={(e) => setOrder(Number(e.target.value))}
                        min={0}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-bg dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 outline-none"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Feature title"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-bg dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="What will this feature do?"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-bg dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 outline-none resize-none"
                />
            </div>
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </form>
    );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

export default function AdminClient() {
    const [authed, setAuthed] = useState<boolean | null>(null);
    const [tab, setTab] = useState<"timeline" | "feedback">("timeline");
    const [features, setFeatures] = useState<Feature[]>([]);
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [loadingFeatures, setLoadingFeatures] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

    // Check auth on mount (only sets false if not already logged in, to avoid race with login)
    useEffect(() => {
        fetch("/api/admin/features")
            .then((r) => setAuthed((prev) => (prev === true ? true : r.ok)))
            .catch(() => setAuthed((prev) => (prev === true ? true : false)));
    }, []);

    const loadFeatures = useCallback(async () => {
        setLoadingFeatures(true);
        try {
            const res = await fetch("/api/admin/features");
            if (res.status === 401) { setAuthed(false); return; }
            if (!res.ok) return;
            const data = await res.json();
            setFeatures(data.features ?? []);
        } finally {
            setLoadingFeatures(false);
        }
    }, []);

    const loadFeedback = useCallback(async () => {
        setLoadingFeedback(true);
        try {
            const res = await fetch("/api/admin/feedback");
            if (!res.ok) return;
            const data = await res.json();
            setFeedback(data.feedback ?? []);
        } finally {
            setLoadingFeedback(false);
        }
    }, []);

    useEffect(() => {
        if (authed) {
            loadFeatures();
            loadFeedback();
        }
    }, [authed, loadFeatures, loadFeedback]);

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        setAuthed(false);
    };

    const handleAddFeature = async (data: Omit<Feature, "id">) => {
        const res = await fetch("/api/admin/features", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? "Failed to add");
        }
        setShowAddForm(false);
        await loadFeatures();
    };

    const handleUpdateFeature = async (id: string, updates: Partial<Feature>) => {
        await fetch("/api/admin/features", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updates }),
        });
        await loadFeatures();
    };

    const handleDeleteFeature = async (id: string) => {
        await fetch("/api/admin/features", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setConfirmDeleteId(null);
        await loadFeatures();
    };

    const handleUpdateFeedbackStatus = async (id: string, status: FeedbackItem["status"]) => {
        await fetch("/api/admin/feedback", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
        setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    };

    if (authed === null) {
        return (
            <div className="min-h-screen bg-bg dark:bg-stone-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authed) {
        return <LoginForm onSuccess={() => setAuthed(true)} />;
    }

    const grouped = groupByDate(features);
    const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

    const feedbackIcons: Record<string, React.ReactNode> = {
        bug: <Bug className="w-3.5 h-3.5" />,
        feature: <Lightbulb className="w-3.5 h-3.5" />,
        general: <MessageCircle className="w-3.5 h-3.5" />,
    };
    const feedbackColors: Record<string, string> = {
        bug: "text-red-500 bg-red-50 dark:bg-red-900/20",
        feature: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        general: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
    };
    const statusColors: Record<string, string> = {
        new: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
        seen: "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400",
        resolved: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    };

    const newFeedbackCount = feedback.filter((f) => f.status === "new").length;

    return (
        <main className="grow bg-bg dark:bg-stone-950 min-h-screen">
            <div className="mx-auto max-w-2xl px-4 pt-10 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100">Admin</h1>
                        <p className="text-xs text-stone-400 dark:text-stone-500">Chessperiment · Features & Feedback</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl w-fit">
                    <button
                        onClick={() => setTab("timeline")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "timeline" ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"}`}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setTab("feedback")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "feedback" ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"}`}
                    >
                        Feedback
                        {newFeedbackCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {newFeedbackCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Timeline Tab ── */}
                {tab === "timeline" && (
                    <div>
                        {/* Add feature button */}
                        {!showAddForm && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl border-2 border-dashed border-amber-400/40 hover:border-amber-400 text-amber-600 dark:text-amber-400 text-sm font-semibold transition-all hover:bg-amber-50 dark:hover:bg-amber-900/10 w-full justify-center"
                            >
                                <Plus className="w-4 h-4" />
                                Add Feature
                            </button>
                        )}

                        {showAddForm && (
                            <div className="mb-6">
                                <FeatureForm
                                    onSave={handleAddFeature}
                                    onCancel={() => setShowAddForm(false)}
                                />
                            </div>
                        )}

                        {loadingFeatures ? (
                            <div className="flex justify-center py-12">
                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : sortedDates.length === 0 ? (
                            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">
                                No features yet. Add the first one!
                            </p>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-[5px] top-2 bottom-0 w-px bg-stone-200 dark:bg-stone-800" />
                                <div className="space-y-0">
                                    {sortedDates.map((date) => {
                                        const dayFeatures = grouped.get(date)!;
                                        const past = isPast(date);
                                        const today = date === TODAY;

                                        return (
                                            <div key={date} className="flex gap-4">
                                                <div className="flex flex-col items-center shrink-0 mt-1.5">
                                                    <div className={`w-3 h-3 rounded-full z-10 border-2 ${today ? "border-amber-500 bg-amber-500/20" : past ? "border-stone-400 dark:border-stone-600 bg-bg dark:bg-stone-950" : "border-amber-400 bg-bg dark:bg-stone-950"}`} />
                                                </div>
                                                <div className={`pb-8 flex-1 ${past && !today ? "opacity-60" : ""}`}>
                                                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${today ? "text-amber-500" : "text-stone-400 dark:text-stone-500"}`}>
                                                        {today ? `Today · ${formatDate(date)}` : formatDate(date)}
                                                    </p>

                                                    {dayFeatures.map((feature) => (
                                                        <div key={feature.id} className="mb-3 last:mb-0">
                                                            {editingId === feature.id ? (
                                                                <FeatureForm
                                                                    initial={feature}
                                                                    onSave={async (data) => {
                                                                        await handleUpdateFeature(feature.id, data);
                                                                        setEditingId(null);
                                                                    }}
                                                                    onCancel={() => setEditingId(null)}
                                                                />
                                                            ) : (
                                                                <div className="group flex items-start justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <p className={`font-semibold text-sm leading-snug ${feature.done ? "line-through text-stone-400 dark:text-stone-600" : "text-stone-900 dark:text-stone-100"}`}>
                                                                            {feature.title}
                                                                        </p>
                                                                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                                                            {feature.description}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleUpdateFeature(feature.id, { done: !feature.done })}
                                                                            title={feature.done ? "Mark undone" : "Mark done"}
                                                                            className={`p-1.5 rounded-lg transition-all ${feature.done ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingId(feature.id)}
                                                                            title="Edit"
                                                                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        {confirmDeleteId === feature.id ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => handleDeleteFeature(feature.id)}
                                                                                    className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setConfirmDeleteId(null)}
                                                                                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
                                                                                >
                                                                                    <X className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => setConfirmDeleteId(feature.id)}
                                                                                title="Delete"
                                                                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Feedback Tab ── */}
                {tab === "feedback" && (
                    <div>
                        {loadingFeedback ? (
                            <div className="flex justify-center py-12">
                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : feedback.length === 0 ? (
                            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">
                                No feedback submitted yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {feedback.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`rounded-xl border transition-colors ${item.status === "new" ? "border-amber-200 dark:border-amber-800 bg-white dark:bg-stone-900" : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 opacity-70"}`}
                                    >
                                        <div className="flex items-start gap-3 p-4">
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${feedbackColors[item.type]}`}>
                                                {feedbackIcons[item.type]}
                                                {item.type}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${statusColors[item.status]}`}>
                                                    {item.status}
                                                </p>
                                                {item.email && (
                                                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{item.email}</p>
                                                )}
                                                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {item.status !== "resolved" && (
                                                    <button
                                                        onClick={() => handleUpdateFeedbackStatus(item.id, "resolved")}
                                                        title="Mark resolved"
                                                        className="p-1.5 rounded-lg text-stone-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {item.status === "new" && (
                                                    <button
                                                        onClick={() => handleUpdateFeedbackStatus(item.id, "seen")}
                                                        title="Mark seen"
                                                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setExpandedFeedback(expandedFeedback === item.id ? null : item.id)}
                                                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                                                >
                                                    {expandedFeedback === item.id
                                                        ? <ChevronUp className="w-4 h-4" />
                                                        : <ChevronDown className="w-4 h-4" />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                        {expandedFeedback === item.id && (
                                            <div className="px-4 pb-4">
                                                <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap bg-stone-50 dark:bg-stone-950 rounded-xl p-3">
                                                    {item.message}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
