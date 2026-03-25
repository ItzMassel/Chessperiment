"use client"
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Bug, Lightbulb, MessageCircle, Send, Mail, CheckCircle } from "lucide-react";
import * as motion from "framer-motion/client";

type FeedbackType = "bug" | "feature" | "general" | null;

export default function FeedbackPage() {
    const t = useTranslations('Feedback');
    const [selectedType, setSelectedType] = useState<FeedbackType>(null);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const feedbackOptions = [
        {
            type: "bug" as FeedbackType,
            icon: <Bug className="w-8 h-8" />,
            title: t("reportBug.title"),
            description: t("reportBug.description"),
            colorClass: "text-red-500 dark:text-red-400",
            gradient: "from-red-500 to-rose-600"
        },
        {
            type: "feature" as FeedbackType,
            icon: <Lightbulb className="w-8 h-8" />,
            title: t("featureSuggestion.title"),
            description: t("featureSuggestion.description"),
            colorClass: "text-blue-500 dark:text-blue-400",
            gradient: "from-blue-500 to-cyan-600"
        },
        {
            type: "general" as FeedbackType,
            icon: <MessageCircle className="w-8 h-8" />,
            title: t("generalFeedback.title"),
            description: t("generalFeedback.description"),
            colorClass: "text-amber-500 dark:text-amber-400",
            gradient: "from-amber-500 to-orange-600"
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: selectedType,
                    email,
                    message,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send feedback");
            }

            setIsSubmitted(true);

            // Reset form after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
                setSelectedType(null);
                setMessage("");
                setEmail("");
            }, 3000);
        } catch (err) {
            setError(t("error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPlaceholder = () => {
        if (selectedType === "bug") return t("reportBug.placeholder");
        if (selectedType === "feature") return t("featureSuggestion.placeholder");
        return t("generalFeedback.placeholder");
    };

    return (
        <main className="grow bg-bg dark:bg-stone-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 sm:py-24">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,var(--color-amber-500),transparent)]/[0.1]" />

                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center space-x-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors mb-6"
                            aria-label={t("backToHome")}
                        >
                            <span>← chessperiment</span>
                        </Link>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-linear-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 mb-4">
                            {t("title")}
                        </h1>
                        <p className="text-lg leading-8 text-stone-600 dark:text-stone-400">
                            {t("subtitle")}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Feedback Form Section */}
            <section className="pb-24 px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    {!selectedType ? (
                        <div>
                            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-8 text-center">
                                {t("selectPrompt")}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {feedbackOptions.map((option, index) => (
                                    <motion.button
                                        key={option.type}
                                        onClick={() => setSelectedType(option.type)}
                                        className="group relative overflow-hidden bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        aria-label={`Select ${option.title}`}
                                    >
                                        <div className={`absolute inset-0 bg-linear-to-br ${option.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                                        <div className={`flex justify-center mb-4 ${option.colorClass}`}>
                                            {option.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-3 text-center">
                                            {option.title}
                                        </h3>
                                        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
                                            {option.description}
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ) : isSubmitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-12 text-center border-2 border-green-200 dark:border-green-800"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="bg-green-100 dark:bg-green-800 rounded-full p-4">
                                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-50 mb-2">
                                {t("thankYou")}
                            </h2>
                            <p className="text-stone-600 dark:text-stone-400">
                                {t("thankYouMessage")}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-lg border-2 border-stone-200 dark:border-stone-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                                        {feedbackOptions.find(o => o.type === selectedType)?.title}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedType(null)}
                                        className="text-sm text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium"
                                    >
                                        {t("cancel")}
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {t("emailPlaceholder")}
                                            </div>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                                            {t("messageLabel")} *
                                        </label>
                                        <textarea
                                            id="message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            rows={8}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                                            placeholder={getPlaceholder()}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                {t("submitting")}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                {t("submit")}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </div>
            </section>
        </main>
    );
}
