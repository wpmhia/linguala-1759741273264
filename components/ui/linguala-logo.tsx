"use client"

/**
 * Linguala Translate Logo - Clean Text-Based Design
 * 
 * Design Elements:
 * - Clean, rounded typography for modern professional appearance
 * - Monochrome dark text for clean, professional look
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
    lg: "text-2xl", 
    xl: "text-3xl"
  }

  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn(
        "font-normal text-gray-700",
        "font-['Product_Sans',_'Roboto',_'Arial',_sans-serif]",
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
      <span className="text-lg font-normal text-gray-700 font-['Product_Sans',_'Roboto',_'Arial',_sans-serif]">
        LT
      </span>
    </div>
  )
}