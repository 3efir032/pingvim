"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>("pycharm-theme", "dark")

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove("dark", "light")
    document.documentElement.classList.add(theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
