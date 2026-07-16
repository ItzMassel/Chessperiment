import { auth } from "@/auth";
import { getBoardAction, getCustomPieceAction, getPieceSetAction, getSetPiecesAction } from "@/app/actions/library";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import BoardDetailClient from "@/components/editor/BoardDetailClient";
import PieceDetailClient from "@/components/editor/PieceDetailClient";
import SetDetailClient from "@/components/editor/SetDetailClient";
import { CustomPiece as CustomPieceType, PieceSet } from "@/lib/firestore";

export default async function LibraryDetailPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = await params;
    const session = await auth();
    const t = await getTranslations('Library');

    if (!session?.user) {
        redirect("/login");
    }

    let board = await getBoardAction(id);
    let piece: CustomPieceType | null = null;
    let set: PieceSet | null = null;
    let setPieces: CustomPieceType[] = [];

    if (!board) {
        piece = await getCustomPieceAction(id);
        if (!piece) {
            set = await getPieceSetAction(id);
            if (set) {
                setPieces = await getSetPiecesAction(id);
            } else {
                notFound();
            }
        }
    }

    const commonTranslations = {
        details: t('details'),
        lastUpdated: t('lastUpdated'),
        edit: t('edit'),
        backToLibrary: t('backToLibrary')
    };

    return (
        <main className="min-h-screen bg-bg lg:px-20 lg:py-16 p-6">
            <div className="max-w-7xl mx-auto">
                {board ? (
                    <BoardDetailClient
                        board={JSON.parse(JSON.stringify(board))}
                        locale={locale}
                        userName={session.user.name || "Unknown"}
                        translations={{
                            play: t('play'),
                            publish: t('publish'),
                            ...commonTranslations,
                            size: t('size'),
                        }}
                    />
                ) : set ? (
                    <SetDetailClient
                        set={JSON.parse(JSON.stringify(set))}
                        pieces={JSON.parse(JSON.stringify(setPieces))}
                        locale={locale}
                        translations={commonTranslations}
                    />
                ) : (
                    <PieceDetailClient
                        piece={JSON.parse(JSON.stringify(piece))}
                        locale={locale}
                        translations={commonTranslations}
                    />
                )}
            </div>
        </main>
    );
}
