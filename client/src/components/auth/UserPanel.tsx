"use client"

import { signOut as nextAuthSignOut } from "next-auth/react"
import { auth, isConfigured } from "@/lib/firebase-client"
import { useAuth } from "@/context/AuthContext"
import { useTranslations } from "next-intl"
import { LogIn, LogOut, User as UserIcon, ChevronUp } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "@/i18n/navigation"
import Image from "next/image"

export function UserPanel() {
    const { user, loading } = useAuth()
    const t = useTranslations("Auth")
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleLogout = async () => {
        if (auth) {
            const { signOut: firebaseSignOut } = await import("firebase/auth")
            await firebaseSignOut(auth)
        }
        await nextAuthSignOut()
        setIsOpen(false)
        router.refresh()
    }

    // Hide the user panel entirely in offline mode when no user is signed in
    if (!isConfigured && !user) {
        return null
    }

    if (loading) {
        return (
            <div className="hidden lg:block fixed bottom-6 right-6 z-100">
                <div className="w-12 h-12 rounded-full bg-islands/60 shadow-lg backdrop-blur-md border border-amber-400/30 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-400"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="hidden lg:block fixed bottom-6 right-6 z-100">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 p-4 bg-islands/90 backdrop-blur-xl border border-amber-400/20 rounded-2xl shadow-2xl min-w-[200px]"
                    >
                        {user ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 pb-3 border-b border-amber-400/10">
                                    {user.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.name || "User"}
                                            className="w-10 h-10 rounded-full border border-amber-400/20"
                                            width={40}
                                            height={40}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                            <UserIcon size={20} className="text-amber-400" />
                                        </div>
                                    )}
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-bold text-text dark:text-white truncate">
                                            {user.name || user.email?.split('@')[0] || "User"}
                                        </span>
                                        <span className="text-xs text-amber-600/70 dark:text-amber-400/60 truncate">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 w-full p-2 text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors text-sm"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <UserIcon size={16} />
                                    {t("profile")}
                                </Link>

                                <button
                                    className="flex items-center gap-2 w-full p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors text-sm"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    {t("logout")}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm text-amber-400/60 mb-1">
                                    {t("readyToPlay")}
                                </p>
                                <button
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-amber-400 text-bg font-bold rounded-xl hover:bg-amber-300 transition-all active:scale-[0.98]"
                                    onClick={() => router.push('/login')}
                                >
                                    <LogIn size={18} />
                                    {t("login")}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg border ${isOpen
                    ? "bg-amber-400 border-amber-500 text-bg rotate-180"
                    : "bg-islands/60 backdrop-blur-md border-amber-400/30 text-amber-600 dark:text-amber-400 hover:border-amber-400 active:scale-95"
                    }`}
            >
                {user && !isOpen ? (
                    user.image ? (
                        <Image
                            src={user.image}
                            alt="User"
                            className="w-full h-full rounded-full"
                            width={48}
                            height={48}
                        />
                    ) : (
                        <UserIcon size={24} />
                    )
                ) : (
                    <ChevronUp size={24} />
                )}
            </button>
        </div>
    )
}
