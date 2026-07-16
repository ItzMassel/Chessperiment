"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase-client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface LoginFormProps {
    onSwitchToSignup: () => void
    onSwitchToReset: () => void
}

export default function LoginForm({ onSwitchToSignup, onSwitchToReset }: LoginFormProps) {
    const t = useTranslations("Auth")
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!auth) {
        return (
            <div className="w-full p-6 text-center">
                <p className="text-white/60">Firebase is not configured. Login is unavailable in offline mode.</p>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const userCredential = await signInWithEmailAndPassword(auth!, email, password)
            const idToken = await userCredential.user.getIdToken()

            // Sync with NextAuth session
            const result = await signIn("credentials", {
                idToken,
                redirect: false
            })

            if (result?.error) {
                console.error("NextAuth signin error:", result.error)
            }

            // Redirect to home
            router.push("/")
        } catch (err: any) {
            console.error(err)
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError(t("invalidCredentials"))
            } else if (err.code === "auth/too-many-requests") {
                setError(t("tooManyRequests"))
            } else {
                setError(t("loginError"))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4 animate-in fade-in slide-in-from-left-8 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t("welcomeBack")}</h2>

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

            {/* Password */}
            <div className="space-y-1 relative">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-white/60 text-sm">{t("password")}</label>
                    <button
                        type="button"
                        onClick={onSwitchToReset}
                        className="text-amber-400 hover:text-amber-300 text-xs font-medium hover:underline transition-colors"
                    >
                        {t("forgotPassword")}
                    </button>
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setError(null)
                        }}
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
                {loading ? <Loader2 className="animate-spin" /> : t("signIn")}
            </button>

            <div className="text-center mt-6">
                <p className="text-white/50 text-sm">
                    {t("dontHaveAccount")}{" "}
                    <button
                        type="button"
                        onClick={onSwitchToSignup}
                        className="text-amber-400 hover:text-amber-300 font-semibold hover:underline transition-all"
                    >
                        {t("signUp")}
                    </button>
                </p>
            </div>
        </form>
    )
}
