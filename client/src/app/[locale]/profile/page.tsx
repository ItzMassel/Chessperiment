"use client"

import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { bungee } from "@/lib/fonts";
import { Trophy, Target, TrendingUp, Calendar, Edit2, Trash2, Check, X, AlertTriangle } from "lucide-react"
import type { Metadata } from "next"
import { generateHreflangs } from '@/lib/hreflang';
import Image from "next/image";
import { signOut } from "next-auth/react";
import { updateUserNameAction, deleteUserAccountAction } from "@/app/actions/user";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreatorProfileSection from "@/components/dashboard/CreatorProfileSection";

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chessperiment.app');

interface UserStats {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
}

interface GameHistoryItem {
    id: string
    result: "win" | "loss" | "draw"
    opponent?: string
    timestamp: { seconds: number }
    roomId?: string
}


const jsonLdProfilePage = {
    "@context": "https://schema.org",
    "@type": "AboutPage", // alternativ WebPage
    "url": "https://chessperiment.app/profile",
    "name": "Profile – chessperiment",
    "description": "Erfahre mehr über die Profile und Features auf chessperiment, inklusive Benutzerstatistiken, Achievements und personalisierten Einstellungen.",
    "publisher": {
        "@type": "Organization",
        "name": "chessperiment",
        "url": "https://chessperiment.app",
        "logo": {
            "@type": "ImageObject",
            "url": "https://chessperiment.app/static/logo.svg"
        }
    }
};

export default function ProfilePage() {
    const { data: session, status } = useSession()
    const t = useTranslations("Profile")
    const [stats, setStats] = useState<UserStats | null>(null)
    const [history, setHistory] = useState<GameHistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditingName, setIsEditingName] = useState(false)
    const [newName, setNewName] = useState("")
    const [isDeletingAccount, setIsDeletingAccount] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (status === "authenticated") {
            fetchUserData()
        }
    }, [status])

    const fetchUserData = async () => {
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch("/api/stats"),
                fetch("/api/history?limit=10")
            ])

            if (statsRes.ok) {
                const statsData = await statsRes.json()
                setStats(statsData)
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json()
                setHistory(historyData)
            }
            if (session?.user?.name) {
                setNewName(session.user.name)
            }
        } catch (error) {
            console.error("Error fetching user data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRename = async () => {
        if (!newName.trim() || newName === session?.user?.name) {
            setIsEditingName(false)
            return
        }

        setIsSubmitting(true)
        try {
            await updateUserNameAction(newName)
            setIsEditingName(false)
            // The session might not update immediately, but revalidatePath will refresh the server component
            // For a client component, we might want to reload or trust the session will update eventually
            window.location.reload()
        } catch (error) {
            console.error("Error updating name:", error)
            alert("Failed to update name")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteAccount = async () => {
        setIsSubmitting(true)
        try {
            await deleteUserAccountAction()
            await signOut({ callbackUrl: "/" })
        } catch (error) {
            console.error("Error deleting account:", error)
            alert("Failed to delete account")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        )
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <h1 className="text-3xl font-bold text-amber-400 mb-4">
                    {t("notLoggedIn")}
                </h1>
                <p className="text-amber-400/60">{t("pleaseLogin")}</p>
            </div>
        )
    }

    const winRate = stats && stats.gamesPlayed > 0
        ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
        : "0.0"

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProfilePage).replace(/</g, '\\u003c') }}
            />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Profile Header */}
                <div className="bg-islands/70 backdrop-blur-xl border border-amber-400/20 shadow-xl rounded-3xl p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        {session?.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-24 h-24 rounded-full border-4 border-amber-400/30"
                                width={96}
                                height={96}
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-amber-400/10 border-4 border-amber-400/30 flex items-center justify-center">
                                <span className="text-4xl text-amber-400">
                                    {session?.user?.name?.[0] || "?"}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="bg-white/10 border border-amber-400/30 rounded-xl px-4 py-2 text-2xl font-bold text-amber-600 dark:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleRename()
                                                if (e.key === "Escape") setIsEditingName(false)
                                            }}
                                        />
                                        <button
                                            onClick={handleRename}
                                            disabled={isSubmitting}
                                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                        >
                                            <Check size={20} />
                                        </button>
                                        <button
                                            onClick={() => setIsEditingName(false)}
                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className={`${bungee.className} text-4xl text-amber-600 dark:text-yellow-400`}>
                                            {session?.user?.name}
                                        </h1>
                                        <button
                                            onClick={() => {
                                                setNewName(session?.user?.name || "")
                                                setIsEditingName(true)
                                            }}
                                            className="p-2 text-amber-500/60 hover:text-amber-500 transition-colors"
                                            title={t("rename")}
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-amber-700/60 dark:text-amber-400/60">{session?.user?.email}</p>
                                <button
                                    onClick={() => setIsDeletingAccount(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400/60 hover:text-red-400 transition-colors rounded-xl border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/5 group"
                                >
                                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                    {t("deleteAccount")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Account Confirmation Dialog */}
                <Dialog open={isDeletingAccount} onOpenChange={setIsDeletingAccount}>
                    <DialogContent className="bg-islands/95 backdrop-blur-xl border border-white/10 rounded-3xl sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-red-400 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" />
                                {t("deleteAccountConfirmTitle")}
                            </DialogTitle>
                            <DialogDescription className="text-amber-700/60 dark:text-amber-400/70 pt-4">
                                {t("deleteAccountConfirmDesc")}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex sm:flex-row gap-3 pt-6">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeletingAccount(false)}
                                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-text dark:text-white rounded-xl"
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isSubmitting}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                            >
                                {isSubmitting ? "Deleting..." : t("deletePermanently")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={<Trophy size={32} />}
                            label={t("wins")}
                            value={stats?.wins || 0}
                            color="text-green-400"
                        />
                        <StatCard
                            icon={<Target size={32} />}
                            label={t("gamesPlayed")}
                            value={stats?.gamesPlayed || 0}
                            color="text-blue-400"
                        />
                        <StatCard
                            icon={<TrendingUp size={32} />}
                            label={t("winRate")}
                            value={`${winRate}%`}
                            color="text-amber-400"
                        />
                        <StatCard
                            icon={<Calendar size={32} />}
                            label={t("rating")}
                            value={stats?.rating || 1500}
                            color="text-purple-400"
                        />
                    </div>

                    {/* Recent Games */}
                    <div className="bg-islands/70 backdrop-blur-xl border border-amber-400/20 shadow-xl rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-400 mb-6 font-primary">
                            {t("recentGames")}
                        </h2>

                        {history.length === 0 ? (
                            <p className="text-amber-400/60 text-center py-8">
                                {t("noGamesYet")}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {history.map((game) => (
                                    <GameHistoryCard key={game.id} game={game} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({ icon, label, value, color }: any) {
    return (
        <div className="bg-islands shadow-md border border-amber-400/10 rounded-2xl p-6 transition-all hover:shadow-lg">
            <div className={`${color} mb-3`}>{icon}</div>
            <div className="text-3xl font-bold text-text dark:text-white mb-1">{value}</div>
            <div className="text-sm text-amber-700/60 dark:text-amber-400/60">{label}</div>
        </div>
    );
}

function GameHistoryCard({ game }: { game: GameHistoryItem }) {
    const resultColors = {
        win: "bg-green-400/10 border-green-400/30 text-green-400",
        loss: "bg-red-400/10 border-red-400/30 text-red-400",
        draw: "bg-amber-400/10 border-amber-400/30 text-amber-400",
    }

    const date = new Date(game.timestamp.seconds * 1000).toLocaleDateString()

    return (
        <div className="flex items-center justify-between p-4 bg-islands/40 border border-amber-400/10 rounded-xl">
            <div className="flex items-center gap-4">
                <div
                    className={`px-4 py-2 rounded-lg border font-bold uppercase ${resultColors[game.result]}`}
                >
                    {game.result}
                </div>
                <div>
                    <p className="text-text dark:text-white font-medium truncate max-w-[120px] sm:max-w-xs">
                        {game.opponent || "Unknown Opponent"}
                    </p>
                    <p className="text-sm text-amber-700/60 dark:text-amber-400/60">{date}</p>
                </div>
            </div>
            {game.roomId && (
                <div className="text-xs text-amber-400/40 font-mono">
                    {game.roomId}
                </div>
            )}
        </div>
    );
}
