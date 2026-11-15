"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { resetPasswordAction } from "@/app/actions/auth"

export default function ResetPasswordClient({ token }: { token: string | null }) {
    const t = useTranslations("Auth")
    const router = useRouter()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    if (!token) {
        return (
            <div className="w-full p-6 text-center">
                <p className="text-white/60">{t("invalidResetLink")}</p>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError(t("passwordsDoNotMatch"))
            return
        }
        if (password.length < 6) {
            setError(t("passwordTooShort"))
            return
        }

        setLoading(true)
        try {
            const result = await resetPasswordAction(token, password)
            if (result.success) {
                setSuccess(true)
                setTimeout(() => router.push("/login"), 2000)
            } else {
                setError(result.error)
            }
        } catch (err) {
            console.error(err)
            setError(t("errorSendingReset"))
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="w-full p-6 text-center">
                <p className="text-green-400 font-medium">{t("passwordResetSuccess")}</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t("resetPassword")}</h2>

            <div className="space-y-1 relative">
                <label className="text-white/60 text-sm ml-1">{t("newPassword")}</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null) }}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all pr-10"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-white/60 text-sm ml-1">{t("confirmPassword")}</label>
                <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium text-center animate-shake">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" /> : t("resetPassword")}
            </button>
        </form>
    )
}
