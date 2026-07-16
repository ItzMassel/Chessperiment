"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = resolvedTheme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <div 
            className="fixed bottom-6 z-100 transition-all duration-500 ease-in-out"
            style={{ 
                left: `calc(1.5rem + var(--ai-sidebar-width, 0px))`
            }}
        >
            <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-colors duration-500 overflow-hidden
          ${isDark ? "bg-slate-900 border-2 border-slate-700" : "bg-sky-400 border-2 border-sky-300"}
        `}
                style={{
                    visibility: mounted ? "visible" : "hidden",
                    boxShadow: isDark
                        ? "0 0 30px -5px rgba(30, 41, 59, 0.6)"
                        : "0 0 30px -5px rgba(56, 189, 248, 0.8)"
                }}
                aria-label="Toggle Theme"
            >
                {/* Background elements for magic feel */}
                <AnimatePresence mode="wait">
                    {isDark ? (
                        <motion.div
                            key="stars"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            <div className="absolute top-2 left-4 w-0.5 h-0.5 bg-white rounded-full opacity-80" />
                            <div className="absolute top-6 left-2 w-1 h-1 bg-indigo-200 rounded-full opacity-60" />
                            <div className="absolute bottom-3 right-5 w-0.5 h-0.5 bg-white rounded-full opacity-90" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="clouds"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            <div className="absolute top-1 right-2 w-6 h-6 bg-white/30 rounded-full blur-sm" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={false}
                    animate={{
                        rotate: isDark ? 0 : 120,
                        scale: isDark ? 1 : 0,
                        opacity: isDark ? 1 : 0
                    }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute"
                >
                    <Moon className="w-7 h-7 text-indigo-100" fill="currentColor" strokeWidth={1.5} />
                </motion.div>

                <motion.div
                    initial={false}
                    animate={{
                        rotate: isDark ? -120 : 0,
                        scale: isDark ? 0 : 1,
                        opacity: isDark ? 0 : 1
                    }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute"
                >
                    <Sun className="w-7 h-7 text-yellow-100" fill="currentColor" strokeWidth={1.5} />
                </motion.div>
            </motion.button>
        </div>
    )
}
