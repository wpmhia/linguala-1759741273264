"use client"

import { useTheme } from "@/components/providers/theme-provider"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Palette } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />
    if (theme === "dark") return <Moon className="h-4 w-4" />
    return <Palette className="h-4 w-4" />
  }

  const getLabel = () => {
    if (theme === "light") return "Switch to dark mode"
    if (theme === "dark") return "Switch to system theme"
    return "Switch to light mode"
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      aria-label={getLabel()}
      className="p-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 rounded-full transition-all duration-300 hover:scale-110 relative overflow-hidden group"
    >
      <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
        {getIcon()}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
    </Button>
  )
}