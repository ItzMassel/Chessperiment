"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Bug, Lightbulb, MessageCircle, Send } from "lucide-react";
import * as motion from "framer-motion/client";

type FeedbackType = "bug" | "feature" | "general" | null;

export default function FeedbackClient() {
    const t = useTranslations("Features.feedback");

    const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      try {
          const response = await fetch("https://api.chessperiment.app/api/feedback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: feedbackType,
              message: message,
              email: email || null,
              page: window.location.pathname,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to send feedback");
          }

          const data = await response.json();

          console.log("Feedback sent:", data);

          // Reset form
          setMessage("");
          setEmail("");

        } catch (error) {
          console.error("Feedback error:", error);
          setError("Could not send feedback. Please try again.");
        }

    };

    const feedbackOptions = [
        {
            type: "bug" as const,
            icon: <Bug className="w-5 h-5" />,
            label: t("bug"),
            color: "text-red-500 dark:text-red-400",
            ring: "ring-red-400/40 hover:ring-red-400",
        },
        {
            type: "feature" as const,
            icon: <Lightbulb className="w-5 h-5" />,
            label: t("feature"),
            color: "text-amber-500 dark:text-amber-400",
            ring: "ring-amber-400/40 hover:ring-amber-400",
        },
        {
            type: "general" as const,
            icon: <MessageCircle className="w-5 h-5" />,
            label: t("general"),
            color: "text-blue-500 dark:text-blue-400",
            ring: "ring-blue-400/40 hover:ring-blue-400",
        },
    ];

    return (
        <main className="grow bg-bg dark:bg-stone-950 min-h-screen">
            <section className="mx-auto max-w-2xl px-6 pt-12 pb-20">
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

                {feedbackType === null ? (
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
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-2 text-sm font-medium ${feedbackOptions.find((o) => o.type === feedbackType)?.color}`}>
                                {feedbackOptions.find((o) => o.type === feedbackType)?.icon}
                                {feedbackOptions.find((o) => o.type === feedbackType)?.label}
                            </span>
                            <button
                                type="button"
                                onClick={() => { setFeedbackType(null); setError(""); }}
                                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                            >
                                {t("cancel")}
                            </button>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                        )}

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            minLength={5}
                            maxLength={2000}
                            rows={4}
                            placeholder={t("messagePlaceholder")}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none resize-none transition-all"
                        />

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t("emailPlaceholder")}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                        />

                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            {t("submit")}
                        </button>
                    </motion.form>
                )}
            </section>
        </main>
    );
}

//
