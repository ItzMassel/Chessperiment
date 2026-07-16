"use client"
import { zillaSlab, lexend } from '@/lib/fonts';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Play, Plus, ScanEye } from 'lucide-react';

// Local fonts are now in @/lib/fonts

export default function Btn() {
    const t = useTranslations('Homepage');
    const router = useRouter()

    return (
        <div className='flex items-center flex-col gap-9 pt-10 px-4 w-full'>
            <button
                type="button" className={`-mb-4 block w-full max-w-xl md:max-w-lg sm:max-w-sm h-14 sm:h-[60px] lg:h-[78px] p-0 overflow-hidden cursor-pointer
        transition-all duration-300 antialiased lg:text-[2.8rem] text-2xl sm:text-[2rem] leading-5 lg:leading-[30px] rounded-[10px]
        shadow-lg ${zillaSlab.className} mt-1 active:scale-95 group`}
                style={{
                    backgroundColor: "#1a1a1a",
                    backgroundImage: "url('/PlayBtn.webp')",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    color: "#F2FF00",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                    caretColor: "transparent",
                }}
                onClick={() => {
                    router.push("/game")
                }}>
                <div className="flex items-center justify-center gap-4 w-full h-full bg-black/20">
                    <span>{t('play')}</span>
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3px] group-hover:scale-110 transition-transform duration-300" />
                </div>
            </button>


            <div className="relative group pt-4 rounded-[10px] w-full max-w-xl md:max-w-lg sm:max-w-sm">
                <button type="button" className={`block w-full h-14 sm:h-[60px] lg:h-[78px] p-0 -mb-4
        cursor-pointer transition-all duration-300 antialiased lg:text-[2.8rem] text-2xl sm:text-[2rem] leading-5 lg:leading-[30px]
        shadow-lg ${zillaSlab.className} mt-1 group rounded-[10px]
        `}
                    style={{
                        backgroundColor: "#1a1a1a",
                        backgroundImage: "url('/Board2.1.webp')",
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        color: "#F2FF00",
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        caretColor: "transparent",
                    }}
                    onClick={() => {
                        router.push("/editor")
                    }}>
                    <div className="relative z-10 flex items-center justify-center gap-4 w-full h-full bg-black/20 rounded-[10px]">
                        <span>{t('create')}</span>
                        <Plus className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3px] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </button>

            </div>
            <div className="relative group pt-4 rounded-[10px] w-full max-w-xl md:max-w-lg sm:max-w-sm">
                <button
                    type="button"
                    onClick={() => null}
                    className={`relative block w-full h-14 sm:h-[60px] lg:h-[78px] rounded-[10px]
            transition-all duration-300 antialiased lg:text-[2.8rem] text-2xl sm:text-[2rem]
            leading-5 lg:leading-[30px] shadow-lg ${zillaSlab.className}
            before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-white/50 dark:before:bg-black/50 before:backdrop-blur-[2px] before:rounded-[10px] before:z-10 cursor-not-allowed
            group overflow-hidden
            `}
                    style={{
                        backgroundColor: "#1a1a1a",
                        color: "#F2FF00",
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        caretColor: "transparent",
                    }}
                >
                    {/* Only render video on desktops to prevent mobile glitches */}
                    <div className="hidden lg:block absolute inset-0 z-0">
                        <video
                            src="/Analyze.mp4"
                            loop
                            muted
                            playsInline
                            autoPlay
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "10px"
                            }}
                        />
                    </div>
                    {/* Fallback pattern for mobile */}
                    <div className="lg:hidden absolute inset-0 z-0 bg-stone-800 opacity-50 bg-[radial-gradient(#444_1px,transparent_1px)] bg-size-[20px_20px]" />

                    <div
                        className="relative z-20 flex items-center justify-center gap-4 w-full h-full"
                    >
                        <span>{t('analyze')}</span>
                        <ScanEye className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3px]" />
                    </div>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-max
                    invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity delay-500 duration-300
                    bg-gray-800 text-white text-sm rounded-md p-2 shadow-lg cursor-auto -mb-1
                    ${lexend.className}`}>
                        <p className="text-center text-shadow-none">{t('notAvailable')} <Link
                            href="/features/analyze"
                            className="underline hover:text-yellow-300"
                        >{t('learnMore')}</Link>
                        </p>
                    </div>
                </button>
            </div>

        </div>
    );
}