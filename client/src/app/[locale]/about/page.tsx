import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { LayoutGrid, Cpu, Code2, Users } from "lucide-react";
import * as motion from "framer-motion/client";
import { DonationCard } from "@/components/DonationCard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "SEO.About" });
    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/about`,
            languages: {
                "en": "https://chessperiment.app/en/about",
                "de": "https://chessperiment.app/de/about"
            }
        },
    };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "About" });

    const features = [
        {
            icon: <LayoutGrid className="w-8 h-8 text-orange-500" />,
            title: t("features.customBoards.title"),
            description: t("features.customBoards.description"),
        },
        {
            icon: <Cpu className="w-8 h-8 text-blue-500" />,
            title: t("features.pieceEditor.title"),
            description: t("features.pieceEditor.description"),
        },
        {
            icon: <Code2 className="w-8 h-8 text-purple-500" />,
            title: t("features.visualScripting.title"),
            description: t("features.visualScripting.description"),
        },
        {
            icon: <Users className="w-8 h-8 text-green-500" />,
            title: t("features.variants.title"),
            description: t("features.variants.description"),
        },
    ];

    return (
        <main className="grow bg-bg dark:bg-stone-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-24 sm:py-32">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,var(--color-orange-500),transparent)]/[0.1]" />
                <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-bg dark:bg-stone-950 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500/5 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Link href="/" className="inline-flex items-center space-x-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 transition-colors mb-8">
                                <span>← chessperiment</span>
                            </Link>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-linear-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400">
                                {t("title")}
                            </h1>
                            <p className="mt-8 text-lg leading-8 text-stone-600 dark:text-stone-400">
                                {t("intro")}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 sm:py-32 bg-stone-50/50 dark:bg-stone-900/20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-orange-600 dark:text-orange-400">
                            {t("features.title")}
                        </h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
                            Everything you need to redefine chess
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    className="flex flex-col"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-stone-900 dark:text-stone-50">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700">
                                            {feature.icon}
                                        </div>
                                        {feature.title}
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-stone-600 dark:text-stone-400">
                                        <p className="flex-auto">{feature.description}</p>
                                    </dd>
                                </motion.div>
                            ))}
                        </dl>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="relative isolate overflow-hidden bg-stone-950 dark:bg-stone-900 px-6 py-24 text-center shadow-2xl rounded-3xl sm:px-16 border border-white/10 group backdrop-blur-sm"
                    >
                        <div className="relative z-10">
                            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-linear-to-r from-white via-orange-100 to-amber-200">
                                {t("mission.title")}
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-stone-300 font-medium">
                                {t("mission.description")}
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-8">
                                <Link
                                    href="/editor"
                                    className="rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                >
                                    Start Creating
                                </Link>
                                <Link href="/game" className="group/link text-sm font-semibold leading-6 text-white flex items-center gap-1 hover:text-orange-300 transition-colors">
                                    {t("features.variants.title")}
                                    <span className="group-hover/link:translate-x-1 transition-transform" aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>

                        {/* Background SVG Decoration with Enhanced Gradient */}
                        <svg
                            viewBox="0 0 1024 1024"
                            className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                            aria-hidden="true"
                        >
                            <circle cx="512" cy="512" r="512" fill="url(#chessperiment-gradient)" />
                            <defs>
                                <radialGradient id="chessperiment-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 512) rotate(90) scale(512)">
                                    <stop stopColor="#f97316" />
                                    <stop offset="0.6" stopColor="#fbbf24" />
                                    <stop offset="1" stopColor="#5e5ce6" />
                                </radialGradient>
                            </defs>
                        </svg>

                        {/* Animated Glow Effect */}
                        <div className="absolute inset-0 -z-10 bg-linear-to-tr from-orange-500/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Decorative borders */}
                        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-orange-500/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/50 to-transparent" />
                    </motion.div>
                </div>
            </section>

            {/* Developer Section */}
            <section className="py-24 sm:py-32 mb-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <div className="flex items-center gap-x-4 mb-4">
                            <div className="h-1 w-12 bg-orange-600 dark:bg-orange-400 rounded-full" />
                            <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
                                {t("developer.title")}
                            </h2>
                        </div>
                        <p className="mt-6 text-lg leading-8 text-stone-600 dark:text-stone-400">
                            {t("developer.description")}
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-3xl">
                        <DonationCard />
                    </div>
                </div>
            </section>
        </main>
    );
}
