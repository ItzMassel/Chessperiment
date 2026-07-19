"use server";
import 'server-only';

import { auth } from "@/auth";
import { deleteUserAccount, updateUserName } from "@/db";
import { revalidatePath } from "next/cache";

export async function deleteUserAccountAction() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await deleteUserAccount(session.user.id);
    // Note: Sign out should be handled on the client side after this action succeeds
}

export async function updateUserNameAction(newName: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    if (!newName || newName.trim().length === 0) {
        throw new Error("Name cannot be empty");
    }

    await updateUserName(session.user.id, newName.trim());
    revalidatePath("/profile");
}
