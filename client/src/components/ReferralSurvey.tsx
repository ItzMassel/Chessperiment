"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Send, MessageSquareQuote, Loader2 } from "lucide-react";
import { submitReferralAction } from "@/app/actions/survey";

export const ReferralSurvey = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [otherText, setOtherText] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check if user has already answered or dismissed
        const answered = localStorage.getItem("referral_survey_status");
        if (!answered) {
            setHasAnswered(false);
            // Show after a short delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const options = [
        "Reddit",
        "Discord",
        "Other chess forums (Chess.com, Lichess etc.)",
        "AI (ChatGPT, Gemini etc.)",
        "Recommendation",
        "Other"
    ];

    const handleSubmit = async () => {
        const finalAnswer = selectedOption === "Other" ? `Other: ${otherText}` : selectedOption;
        if (!finalAnswer) return;

        setIsSubmitting(true);
        try {
            const result = await submitReferralAction(finalAnswer);

            if (result.success) {
                localStorage.setItem("referral_survey_status", "answered");
                setIsVisible(false);
            } else {
                console.error("Failed to submit survey:", result.error);
                alert("Sorry, there was an error submitting your response. Please try again.");
            }
        } catch (error) {
            console.error("Failed to submit survey:", error);
            alert("Sorry, there was an error submitting your response. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem("referral_survey_status", "dismissed");
        setIsVisible(false);
    };

    if (hasAnswered) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: -20, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: -20, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed bottom-24 left-6 z-90 w-72"
                >
                    <div className="relative bg-white/70 dark:bg-stone-900/70 backdrop-blur-2xl border border-white/20 dark:border-stone-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-5 group">
                        {/* Decorative accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-400 to-orange-500 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1"
                            aria-label="Dismiss survey"
                        >
                            <X size={14} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-400/10 dark:bg-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <MessageSquareQuote size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">
                                Quick question...
                            </h3>
                        </div>

                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
                            We're curious! How did you find your way to <span className="text-amber-600 dark:text-amber-400 font-semibold">Chessperiment</span>?
                        </p>

                        <div className="relative">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full flex justify-between items-center bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 px-4 py-2.5 rounded-xl text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-all shadow-sm"
                            >
                                <span className="truncate pr-2">
                                    {selectedOption || "Select an option..."}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-300 text-stone-400 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0, y: -10 }}
                                        animate={{ height: "auto", opacity: 1, y: 0 }}
                                        exit={{ height: 0, opacity: 0, y: -10 }}
                                        className="absolute bottom-full left-0 w-full mb-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur-xl border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden z-10"
                                    >
                                        <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                                            {options.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        setSelectedOption(option);
                                                        setIsExpanded(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${selectedOption === option
                                                        ? "bg-amber-400 text-stone-900 font-medium"
                                                        : "hover:bg-amber-400/10 text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {selectedOption === "Other" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3"
                            >
                                <input
                                    type="text"
                                    placeholder="Tell us more..."
                                    value={otherText}
                                    onChange={(e) => setOtherText(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 rounded-xl focus:ring-2 focus:ring-amber-400/50 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 transition-all shadow-sm"
                                    autoFocus
                                />
                            </motion.div>
                        )}

                        {selectedOption && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="mt-4 w-full bg-linear-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                                <span>{isSubmitting ? "Sending..." : "Submit"}</span>
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
