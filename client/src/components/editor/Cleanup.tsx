"use client"
import { useTranslations } from "next-intl";
import { RefreshCcw } from "lucide-react"

export default function CleanUp({ handleCleanup }: { handleCleanup: () => void }) {
    const t = useTranslations('Editor.Board');
    return (
        <button onClick={handleCleanup} className="flex items-center gap-2 text-[hsl(0,0%,95%)] border border-gray-200 h-12 rounded-xl p-4 bg-gray-900 translate-y-7">
            <RefreshCcw />
            {t("cleanup")}
        </button>
    )
}
