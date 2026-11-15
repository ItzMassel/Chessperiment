"use client"

import { useState } from "react"
import { requestPasswordResetAction } from "@/app/actions/auth"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { useTranslations } from "next-intl"

interface PasswordResetFormProps {
    onSwitchToLogin: () => void
}

export default function PasswordResetForm({ onSwitchToLogin }: PasswordResetFormProps) {
    const t = useTranslations("Auth")

    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setMessage(null)
        setLoading(true)

        try {
            const result = await requestPasswordResetAction(email)
            if (result.success) {
                setMessage(t("passwordResetSent"))
            } else {
                setError(t("errorSendingReset"))
            }
        } catch (err: any) {
            console.error(err)
            setError(t("errorSendingReset"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button
                type="button"
                onClick={onSwitchToLogin}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-2"
            >
                <ArrowLeft size={16} />
                {t("backToLogin")}
            </button>

            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                    <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t("resetPassword")}</h2>
                <p className="text-white/60 text-sm">{t("resetPasswordDesc")}</p>
            </div>

            {/* Email */}
            <div className="space-y-1">
                <label className="text-white/60 text-sm ml-1">{t("email")}</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="name@example.com"
                />
            </div>

            {message && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-medium text-center">
                    {message}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium text-center animate-shake">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !!message}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : t("sendResetLink")}
            </button>
        </form>
    )
}
