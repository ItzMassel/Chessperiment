import ResetPasswordClient from "./ResetPasswordClient"
import { outfit } from "@/lib/fonts"
import Image from "next/image"

export const metadata = {
    robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const { token } = await searchParams

    return (
        <div className={`relative min-h-screen flex items-center justify-center px-4 overflow-hidden ${outfit.className}`}>
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/auth/login-bg.png"
                    alt="Chess Background"
                    fill
                    className="object-cover scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/40" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="p-8 md:p-12 bg-white/5 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl">
                    <ResetPasswordClient token={token ?? null} />
                </div>
            </div>
        </div>
    )
}
