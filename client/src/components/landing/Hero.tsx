"use client"

import React from 'react';
import { Link } from '@/i18n/navigation';

const Hero: React.FC = () => {
    return (
        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-8">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                v2.0 Beta Live
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-stone-100 leading-[1.05] mb-8 tracking-tight">
                Build the Game.<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-yellow-500">
                    Break the Rules.
                </span>
            </h1>
            <p className="text-gray-600 dark:text-stone-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                The ultimate visual logic sandbox for inventing, testing, and sharing chess variants. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                <Link
                    href="/editor"
                    className="flex items-center justify-center gap-2 rounded-xl h-16 px-10 bg-amber-400 hover:bg-amber-500 text-gray-900 text-xl font-bold shadow-lg shadow-yellow-500/20 transition-all transform hover:-translate-y-1 w-full sm:w-auto"
                >
                    Start Designing
                </Link>
                <Link
                    href="/game"
                    className="flex items-center justify-center h-16 px-8 text-gray-600 dark:text-stone-400 font-medium hover:text-gray-900 dark:hover:text-stone-100 transition-colors w-full sm:w-auto bg-gray-50 dark:bg-stone-800 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-xl border border-gray-200 dark:border-stone-700"
                >
                    Guest Access
                </Link>
            </div>
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-stone-800 w-full flex justify-center">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuAI66D4wF7zDWezeg5tBNgxc70mWMiBQmK296a7P5QQlGup8p3NlftSdON3zcpjdZSw_fKnoKxXXI2Skpih4dte4FfyDZMIk7kiNkiuizX1yIISrlhNG4kMR1XWoVdy_bGZE8Mpd7Fs8LOVIbQW5yRhV-IOz7H-3Kzrwbi0j5ntPokquEN5Y0kY-3InRJLuXfAmSdSXMWychUiBxbIBcDY2mzvwe5NGAG6wFqgf4cjsZtvnopO37xiWy8mJx1HJLcJ55XTnZip4H3ks",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuDHwd-hqqvgTyCPT0hX0v0BpFm2EzQUMGhb7FzsG-u49dFxGHK9lS0ZHjO5RaWsVx-Ec5UVCFzsHqlZMTKC2pgqAuFFfe9WtzWrwcCGCEXIn6TywI_2qs8yXnH76lESQr2fEOeNp9zIvX5oe57S0hl_q_NSzgiv3thtl7tJUjDWjjGReFMhxMYbLYrMiPmwvJdlxM2CIHct1CHZyuiq3ImMR8ynppM31FdlSFJHELbq8xygClUXvzPtaGp-OjqDkYrJcm7MEARXLStC",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuDw6V4giTSBKOFgR7m4xvsDx_Qu5hcKortTCVC_7nlwjbAJwFFpLC9LgDyOVHNPt59olvlseX5U4XvaeIDwJSd3-y_iJBg3VPudHqaLW7jDSVFB9eDgbF5xCJ2A8JqNn68lIvuOANJJZ0yftH32sQCzEIVCyOuF7UiwViSzuK4fY8inYCkLTKqpuu2JxX-QGCKMDVHzAKlEISZ9HcsiY4y7gIvPik9JwhtgfnZKYchIv7KyBbT_ok4sU4mb3Ai_JM8tuQJuQp0O1Gf5"
                        ].map((url, i) => (
                            <div
                                key={i}
                                className="w-10 h-10 rounded-full border-2 border-white dark:border-stone-900 bg-gray-200 dark:bg-stone-700"
                                style={{
                                    backgroundImage: `url('${url}')`,
                                    backgroundSize: 'cover'
                                }}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col text-left">
                        <div className="flex gap-0.5 h-4">
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-stone-400 uppercase tracking-wide">
                            600+ Creators Trusted
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
