import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClientPage from "./ClientPage";

export default async function CreatorPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    return <ClientPage />;
}
