import type { Metadata } from 'next';
import { auth } from "@/auth";
import { getUserBoardsAction, getUserPieceSetsAction } from "@/app/actions/library";
import LibraryGrid from "@/components/editor/LibraryGrid";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Library as LibraryIcon } from "lucide-react";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default async function LibraryPage() {
    const session = await auth();
    const t = await getTranslations('Library');

    if (!session?.user) {
        redirect("/login");
    }

    const [boards, sets] = await Promise.all([
        getUserBoardsAction(),
        getUserPieceSetsAction()
    ]);

    return (
        <main className="min-h-screen bg-bg lg:px-20 lg:py-16 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-4 border border-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <LibraryIcon size={14} /> {t('title')}
                        </div>
                        <h1 className="text-5xl font-black text-stone-900 dark:text-white tracking-tight">
                            Personal <span className="text-amber-400">Collection</span>
                        </h1>
                        <p className="text-stone-600 dark:text-white/40 text-lg mt-2 max-w-xl">
                            Explore your saved custom game configurations, variants, and starred battlefields.
                        </p>
                    </div>
                </div>

                <LibraryGrid
                    initialBoards={JSON.parse(JSON.stringify(boards))}
                    initialSets={JSON.parse(JSON.stringify(sets))}
                />
            </div>
        </main>
    );
}
