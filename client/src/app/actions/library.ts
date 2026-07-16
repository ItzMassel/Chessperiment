"use server";
import 'server-only';

import { auth } from "@/auth";
import { 
    saveBoard, getUserBoards, toggleBoardStar, deleteBoard, getBoard, SavedBoard, 
    CustomPiece, saveCustomPiece, getUserCustomPieces, getCustomPiece, deleteCustomPiece,
    PieceSet, savePieceSet, getUserPieceSets, getPieceSet, getSetPieces, deletePieceSet, togglePieceSetStar
} from "@/lib/firestore";
import { revalidatePath } from "next/cache";

export async function saveBoardAction(boardData: Omit<SavedBoard, "userId" | "createdAt" | "updatedAt" | "isStarred">) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const board: SavedBoard = {
        ...boardData,
        userId: session.user.id,
        isStarred: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const id = await saveBoard(board);
    // revalidatePath("/profile");
    // revalidatePath("/library");
    return id;
}

export async function getUserBoardsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];
    return await getUserBoards(session.user.id);
}

export async function toggleBoardStarAction(boardId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const result = await toggleBoardStar(boardId, session.user.id);
    // revalidatePath("/profile");
    // revalidatePath("/library");
    return result;
}

export async function deleteBoardAction(boardId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await deleteBoard(boardId, session.user.id);
    // revalidatePath("/profile");
    // revalidatePath("/library");
}

export async function getBoardAction(boardId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await getBoard(boardId, session.user.id);
}

export async function saveCustomPieceAction(piece: Omit<CustomPiece, "userId" | "createdAt" | "updatedAt">) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const fullPiece: CustomPiece = {
        ...piece,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const id = await saveCustomPiece(fullPiece);
    // revalidatePath("/profile");
    // revalidatePath("/library");
    return id;
}

export async function getUserCustomPiecesAction() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await getUserCustomPieces(session.user.id);
}

export async function getCustomPieceAction(pieceId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await getCustomPiece(pieceId, session.user.id);
}

export async function deleteCustomPieceAction(pieceId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await deleteCustomPiece(pieceId, session.user.id);
    // revalidatePath("/profile");
    // revalidatePath("/library");
}

// ==================== PIECE SET ACTIONS ====================

export async function savePieceSetAction(set: Omit<PieceSet, "userId" | "createdAt" | "updatedAt">) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const fullSet: PieceSet = {
        ...set,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const id = await savePieceSet(fullSet);
    // revalidatePath("/profile");
    // revalidatePath("/library");
    return id;
}

export async function getUserPieceSetsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];
    return await getUserPieceSets(session.user.id);
}

export async function getPieceSetAction(setId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return await getPieceSet(setId, session.user.id);
}

export async function getSetPiecesAction(setId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return await getSetPieces(setId, session.user.id);
}

export async function deletePieceSetAction(setId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    await deletePieceSet(setId, session.user.id);
    // revalidatePath("/profile");
    // revalidatePath("/library");
}

export async function togglePieceSetStarAction(setId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const result = await togglePieceSetStar(setId, session.user.id);
    // revalidatePath("/profile");
    // revalidatePath("/library");
    return result;
}
