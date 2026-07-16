import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import FaqClient from "./FaqClient";
import * as motion from "framer-motion/client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "SEO.PieceEditorFAQ" });
    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/editor/piece/faq`,
            languages: {
                "en": "https://chessperiment.app/en/editor/piece/faq",
                "de": "https://chessperiment.app/de/editor/piece/faq"
            }
        },
    };
}

export default async function PieceEditorFaqPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "PieceEditorFAQ" });

    return (
        <main className="grow bg-bg dark:bg-stone-950 pb-24">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 sm:py-24 mb-8">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,var(--color-orange-500),transparent)]/[0.05]" />

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <Link href="/editor/piece" className="inline-flex items-center space-x-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 transition-colors mb-8">
                            <span>← Back to Piece Editor</span>
                        </Link>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black tracking-tight sm:text-6xl text-stone-900 dark:text-white uppercase"
                        >
                            {t("title")}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mt-6 text-lg leading-8 text-stone-600 dark:text-stone-400"
                        >
                            {t("description")}
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* FAQ Content */}
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
                <FaqClient />
            </div>

            {/* CTA Section */}
            <section className="mt-24 mx-auto max-w-7xl px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative isolate overflow-hidden bg-stone-900 px-6 py-16 text-center shadow-2xl rounded-3xl sm:px-16 border border-white/10"
                >
                    <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Still have questions?
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-stone-400">
                        Join our community to get help from other creators or share your own piece designs.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            href="/editor/piece"
                            className="rounded-xl bg-orange-600 px-8 py-4 text-sm font-bold text-white shadow-sm hover:bg-orange-500 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                        >
                            Back to Editor
                        </Link>
                        <a href="https://github.com/lt20202122/chessPIE" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold leading-6 text-white group flex items-center gap-1">
                            GitHub Repository <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </a>
                    </div>
                    {/* Background decoration */}
                    <svg
                        viewBox="0 0 1024 1024"
                        className="absolute left-1/2 top-1/2 -z-10 h-256 w-5xl -translate-x-1/2 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] opacity-20"
                        aria-hidden="true"
                    >
                        <circle cx="512" cy="512" r="512" fill="url(#gradient)" />
                        <defs>
                            <radialGradient id="gradient">
                                <stop stopColor="#f97316" />
                                <stop offset="1" stopColor="#fbbf24" />
                            </radialGradient>
                        </defs>
                    </svg>
                </motion.div>
            </section>
        </main>
    );
}
