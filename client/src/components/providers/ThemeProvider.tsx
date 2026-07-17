"use client"

import * as React from "react"

interface UseThemeProps {
  themes: string[]
  forcedTheme?: string
  setTheme: (theme: string) => void
  theme?: string
  resolvedTheme?: string
  systemTheme?: "dark" | "light"
}

const ThemeContext = React.createContext<UseThemeProps | undefined>(void 0)

const STORAGE_KEY = "theme"
const DEFAULT_THEME = "system"
const THEMES = ["light", "dark"]

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getStoredTheme(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) || undefined
  } catch {
    return undefined
  }
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

function applyTheme(theme: string) {
  const root = document.documentElement
  root.classList.remove(...THEMES)
  if (theme === "dark" || theme === "light") {
    root.classList.add(theme)
  }
  root.style.colorScheme = theme
}

export function ThemeProvider({
  children,
  attribute,
  defaultTheme = DEFAULT_THEME,
  enableSystem = true,
  disableTransitionOnChange = false,
  enableColorScheme = true,
  forcedTheme,
  storageKey = STORAGE_KEY,
  themes = THEMES,
  value,
  nonce,
  scriptProps,
  ...props
}: React.PropsWithChildren<{
  themes?: string[]
  forcedTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  enableColorScheme?: boolean
  storageKey?: string
  defaultTheme?: string
  attribute?: string | string[]
  value?: Record<string, string>
  nonce?: string
  scriptProps?: Record<string, any>
}>) {
  const [theme, setThemeState] = React.useState<string>(defaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<"dark" | "light">("light")
  const [mounted, setMounted] = React.useState(false)

  // Inject theme script via effect (no inline <script> JSX element)
  React.useEffect(() => {
    const stored = getStoredTheme()
    const initial = stored || defaultTheme
    const resolved = initial === "system" ? getSystemTheme() : (initial as "dark" | "light")
    applyTheme(resolved)
    setThemeState(initial)
    setSystemTheme(getSystemTheme())
    setMounted(true)
  }, [])

  // Listen for system theme changes
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      setSystemTheme(mq.matches ? "dark" : "light")
      if (theme === "system") applyTheme(mq.matches ? "dark" : "light")
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  // Sync theme changes to DOM
  React.useEffect(() => {
    if (!mounted) return
    const resolved = theme === "system" ? systemTheme : (theme as "dark" | "light")
    applyTheme(resolved)
  }, [theme, systemTheme, mounted])

  const setTheme = React.useCallback((newTheme: string) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch { }
  }, [storageKey])

  // Listen for storage changes from other tabs
  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setThemeState(e.newValue)
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [storageKey])

  const resolvedTheme = theme === "system" ? systemTheme : (theme as "dark" | "light" | undefined)

  const value_ = React.useMemo(() => ({
    theme,
    setTheme,
    forcedTheme,
    resolvedTheme,
    themes: enableSystem ? [...themes, "system"] : themes,
    systemTheme: enableSystem ? systemTheme : undefined,
  }), [theme, setTheme, forcedTheme, resolvedTheme, themes, enableSystem, systemTheme])

  return (
    <ThemeContext.Provider value={value_}>
      {children}
    </ThemeContext.Provider>
  )
}
