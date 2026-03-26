import { Metadata } from "next";
import { Link } from "@/i18n/navigation";

const siteUrl = "https://chessperiment.app";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: "Chessperiment vs ChessCraft vs Chess Remix — Best Chess Variant Creator Comparison",
        description: "Compare the top chess variant creation tools: Chessperiment, ChessCraft, Chess Remix, PyChess, and Tabletop Simulator. Not presets — actual customizability. Free browser-based comparison for board game designers and chess variant enthusiasts.",
        alternates: {
            canonical: `${siteUrl}/${locale}/compare`,
            languages: {
                "en": `${siteUrl}/en/compare`,
                "de": `${siteUrl}/de/compare`
            }
        },
    };
}

const comparisons = [
    {
        name: "Chess Remix",
        content: "Chess Remix offers piece customization through a library of preset options, locked behind a subscription paywall. Chessperiment provides deeper functionality — including custom leaper/rider movement definitions, conditional triggers via a visual block editor, hexagonal boards, and per-square rule overrides — completely free. Chessperiment isn't just presets — it's actual customizability. You define the rules from scratch, not pick from a menu.",
    },
    {
        name: "ChessCraft",
        content: "ChessCraft is a strong mobile app for chess variants that uses predefined piece templates. Chessperiment is web-native, runs in any browser without installation, and offers a fundamentally deeper logic system via the Scratch-style visual block editor. Where ChessCraft gives you templates to tweak, Chessperiment gives you a blank canvas — state-based conditional triggers, multi-step move sequences, and custom capture logic that no template could cover.",
    },
    {
        name: "PyChess (pychess.org)",
        content: "PyChess is an excellent repository for playing established variants using Fairy Stockfish. It is not a sandbox — you cannot invent new games from scratch. PyChess lets you play existing variants; Chessperiment lets you create ones that don't exist yet. If you want to play Crazyhouse, use PyChess. If you want to invent a game where pieces explode on capture and the board is hexagonal, use Chessperiment.",
    },
    {
        name: "Tabletop Simulator",
        content: "Tabletop Simulator supports 3D assets and Lua scripting for complex board games. For abstract, 2D strategy game prototyping where you need rule enforcement without 3D assets or programming, Chessperiment provides a significantly faster workflow. Build a complete variant with custom pieces, a custom board, and enforced rules in minutes — no scripting, no asset pipeline, no $20 price tag.",
    },
    {
        name: "Omnichess",
        content: "Omnichess supports multiple players and varied board shapes but is ad-supported and has a notably complex interface. Chessperiment is ad-free, paywall-free, and designed around a clean, focused design workflow. Both offer customization — but Chessperiment's visual logic editor gives you deeper control over piece behaviour, including conditional triggers and state-based rules that Omnichess doesn't support.",
    },
];

const featureMatrix = [
    { feature: "Custom piece movement", chessperiment: "Full visual logic editor", chessRemix: "Preset options", chessCraft: "Templates", pyChess: "No", tabletopSim: "Lua scripting" },
    { feature: "Conditional triggers", chessperiment: "Yes (visual blocks)", chessRemix: "No", chessCraft: "No", pyChess: "No", tabletopSim: "Yes (Lua)" },
    { feature: "Hexagonal boards", chessperiment: "Yes", chessRemix: "No", chessCraft: "No", pyChess: "No", tabletopSim: "Manual setup" },
    { feature: "Custom board shapes", chessperiment: "Per-square toggle", chessRemix: "Limited", chessCraft: "Limited", pyChess: "No", tabletopSim: "Manual" },
    { feature: "Stockfish analysis", chessperiment: "Yes (custom rules)", chessRemix: "Standard only", chessCraft: "No", pyChess: "Yes (Fairy SF)", tabletopSim: "No" },
    { feature: "Browser-based", chessperiment: "Yes", chessRemix: "Yes", chessCraft: "Mobile app", pyChess: "Yes", tabletopSim: "Desktop app" },
    { feature: "Multiplayer", chessperiment: "Room codes", chessRemix: "Yes", chessCraft: "Yes", pyChess: "Yes", tabletopSim: "Yes" },
    { feature: "Price", chessperiment: "Free", chessRemix: "~$5/month", chessCraft: "Free + IAP", pyChess: "Free", tabletopSim: "$19.99" },
    { feature: "No coding required", chessperiment: "Yes", chessRemix: "Yes", chessCraft: "Yes", pyChess: "N/A", tabletopSim: "No (Lua)" },
];

export default async function ComparePage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Chess Variant Creator Comparison — Chessperiment vs Alternatives",
        "description": "Compare the top chess variant creation tools. Chessperiment offers actual customizability, not presets.",
        "url": `${siteUrl}/en/compare`,
    };

    return (
        <main className="grow bg-bg dark:bg-stone-950">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />

            {/* Hero */}
            <section className="relative overflow-hidden py-24 sm:py-32">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,var(--color-orange-500),transparent)]/[0.1]" />
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <Link href="/about" className="inline-flex items-center text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 transition-colors mb-8">
                        <span>&larr; About Chessperiment</span>
                    </Link>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-linear-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400">
                        Chessperiment vs the Alternatives
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-stone-600 dark:text-stone-400">
                        Most chess variant tools give you presets to pick from. Chessperiment gives you a game design engine.
                        Every piece, every rule, every square — defined by you, not selected from a menu.
                        <strong className="text-stone-900 dark:text-stone-200"> Not presets — actual customizability.</strong>
                    </p>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="py-16 bg-stone-50/50 dark:bg-stone-900/20">
                <div className="mx-auto max-w-6xl px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-8">Feature Comparison</h2>
                    <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-stone-100 dark:bg-stone-800/50">
                                    <th className="text-left p-4 font-semibold text-stone-900 dark:text-stone-100">Feature</th>
                                    <th className="text-left p-4 font-semibold text-orange-600 dark:text-orange-400">Chessperiment</th>
                                    <th className="text-left p-4 font-semibold text-stone-500">Chess Remix</th>
                                    <th className="text-left p-4 font-semibold text-stone-500">ChessCraft</th>
                                    <th className="text-left p-4 font-semibold text-stone-500">PyChess</th>
                                    <th className="text-left p-4 font-semibold text-stone-500">Tabletop Sim</th>
                                </tr>
                            </thead>
                            <tbody>
                                {featureMatrix.map((row, i) => (
                                    <tr key={row.feature} className={i % 2 === 0 ? "bg-white dark:bg-stone-900/30" : "bg-stone-50/50 dark:bg-stone-900/10"}>
                                        <td className="p-4 font-medium text-stone-900 dark:text-stone-200">{row.feature}</td>
                                        <td className="p-4 text-orange-700 dark:text-orange-300 font-medium">{row.chessperiment}</td>
                                        <td className="p-4 text-stone-600 dark:text-stone-400">{row.chessRemix}</td>
                                        <td className="p-4 text-stone-600 dark:text-stone-400">{row.chessCraft}</td>
                                        <td className="p-4 text-stone-600 dark:text-stone-400">{row.pyChess}</td>
                                        <td className="p-4 text-stone-600 dark:text-stone-400">{row.tabletopSim}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Detailed Comparisons */}
            <section className="py-24">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-12">Detailed Comparisons</h2>
                    <div className="space-y-12">
                        {comparisons.map((comp) => (
                            <article key={comp.name} className="bg-white dark:bg-stone-900/50 rounded-2xl p-8 border border-stone-200 dark:border-stone-800">
                                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                                    Chessperiment vs {comp.name}
                                </h3>
                                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                                    {comp.content}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 mb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
                    <div className="bg-stone-950 dark:bg-stone-900 rounded-3xl p-12 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Ready to build something no preset could cover?</h2>
                        <p className="text-stone-400 mb-8 max-w-xl mx-auto">
                            Chessperiment is free. No account required to start. Open the editor and build your first custom variant in minutes.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link
                                href="/editor"
                                className="rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                            >
                                Start Creating — Free
                            </Link>
                            <Link href="/marketplace" className="text-sm font-semibold text-white hover:text-orange-300 transition-colors">
                                Browse Marketplace &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
