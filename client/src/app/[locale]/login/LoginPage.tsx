"use client"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { outfit } from "@/lib/fonts"

import { useState } from "react"
import SignUpForm from "@/components/auth/SignUpForm"
import LoginForm from "@/components/auth/LoginForm"
import PasswordResetForm from "@/components/auth/PasswordResetForm"

export default function LoginPage({ bungee }: { bungee: any }) {
    const t = useTranslations("Auth")
    const searchParams = useSearchParams()
    const error = searchParams.get("error")
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')

    return (
        <div className={`relative min-h-screen flex items-center justify-center px-4 overflow-hidden ${outfit.className}`}>
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/auth/login-bg.png"
                    alt="Chess Background"
                    fill
                    className="object-cover scale-105 animate-pulse-slow"
                    priority
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/40" />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-3xl">
                <div className="p-8 md:p-16 bg-white/5 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className={`${bungee} text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] whitespace-nowrap`}>
                            chessperiment
                        </h1>
                        <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mb-8" />
                        <p className="text-white/80 text-lg md:text-2xl font-light tracking-widest uppercase">
                            {t("signInToContinue")}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-medium text-center animate-shake">
                            <span className="opacity-70">{t("loginError")}:</span> {error}
                        </div>
                    )}

                    {/* Auth Forms */}
                    <div className="mb-8">
                        {mode === 'login' && (
                            <LoginForm
                                onSwitchToSignup={() => setMode('signup')}
                                onSwitchToReset={() => setMode('reset')}
                            />
                        )}
                        {mode === 'signup' && (
                            <SignUpForm
                                onSwitchToLogin={() => setMode('login')}
                            />
                        )}
                        {mode === 'reset' && (
                            <PasswordResetForm
                                onSwitchToLogin={() => setMode('login')}
                            />
                        )}
                    </div>

                    {/* Divider & Google Auth (Only for login/signup) */}
                    {mode !== 'reset' && (
                        <>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-white/40 backdrop-blur-xl">
                                        {t("or")}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => signIn("google")}
                                className="group relative w-full flex items-center justify-center gap-4 bg-white/5 border border-white/10 text-white py-3.5 px-8 rounded-xl font-medium text-lg hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
                            >
                                <div className="w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                    <svg viewBox="0 0 24 24" className="w-full h-full">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                        />
                                    </svg>
                                </div>
                                <span className="tracking-tight">{t("continueWithGoogle")}</span>
                            </button>
                        </>
                    )}

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <div className="flex items-center justify-center gap-3 mb-6 opacity-30">
                            <div className="h-px w-8 bg-white" />
                            <div className="w-2 h-2 rounded-full border border-white" />
                            <div className="h-px w-8 bg-white" />
                        </div>
                        <p className="text-white/40 text-sm font-medium tracking-widest uppercase">
                            {t("readyToPlay")}
                        </p>
                    </div>
                </div>

                {/* Sub-footer Links/Text */}
                <div className="mt-8 text-center text-white/30 text-xs font-medium tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                    &copy; {new Date().getFullYear()} chessperiment &bull; all rights reserved
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1.05); }
                    50% { transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 20s ease-in-out infinite;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    )
}
