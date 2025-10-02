"use client"

/**
 * Linguala Translate Logo - Clean Text-Based Design
 * 
 * Design Elements:
 * - Clean, rounded typography for modern professional appearance
 * - Blue gradient for trust and technology
 * - Simple, readable text-only approach
 * - Responsive sizing for different contexts
 */

import { cn } from "@/lib/utils"

interface LingualaLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function LingualaLogo({ size = "md", className }: LingualaLogoProps) {
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl", 
    xl: "text-4xl"
  }

  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn(
        "font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight",
        "font-['Inter',_'system-ui',_sans-serif] rounded-lg",
        textSizeClasses[size]
      )}>
        Linguala Translate
      </span>
    </div>
  )
}

// Compact version for small spaces
export function LingualaIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-['Inter',_'system-ui',_sans-serif]">
        LT
      </span>
    </div>
  )
}