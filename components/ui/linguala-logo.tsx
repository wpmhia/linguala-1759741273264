"use client"

/**
 * Linguala Logo - European Translation Platform
 * 
 * Design Elements:
 * - European shield-inspired rounded square container (professional, institutional)
 * - Interlocking circles representing linguistic connection and cultural bridge
 * - European blue-indigo-purple gradient (evoking EU flag colors and premium feel)
 * - Central golden-red accent point (warmth, connection, European heritage)
 * - Clean geometric design suitable for European business contexts
 * - Elegant flourishes suggesting European artistic tradition
 * - Professional typography emphasizing "European Translation" positioning
 */

import { cn } from "@/lib/utils"

interface LingualaLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function LingualaLogo({ size = "md", showText = true, className }: LingualaLogoProps) {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-10 h-10", 
    lg: "w-14 h-14",
    xl: "w-18 h-18"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl", 
    xl: "text-3xl"
  }

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* European-inspired Logo Icon */}
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Elegant European shield-like border */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-lg shadow-lg">
          <div className="w-full h-full bg-white rounded-lg m-0.5 flex items-center justify-center">
            <svg
              viewBox="0 0 32 32"
              className="w-4/5 h-4/5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="europeanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="35%" stopColor="#3730A3" />
                  <stop offset="70%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#9333EA" />
                </linearGradient>
                <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
              
              {/* European-style interlocking circles representing linguistic connection */}
              <circle cx="12" cy="16" r="6" stroke="url(#europeanGradient)" strokeWidth="2.5" fill="none" opacity="0.8"/>
              <circle cx="20" cy="16" r="6" stroke="url(#europeanGradient)" strokeWidth="2.5" fill="none" opacity="0.8"/>
              
              {/* Central connection point with European star motif */}
              <circle cx="16" cy="16" r="2.5" fill="url(#accentGradient)"/>
              
              {/* Elegant European-style flourishes */}
              <path d="M8 10 L10 8 M24 10 L22 8 M8 22 L10 24 M24 22 L22 24" 
                stroke="url(#europeanGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              
              {/* Subtle language flow indicators */}
              <path d="M6 16 L10 16 M22 16 L26 16" 
                stroke="url(#accentGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
        </div>
      </div>

      {/* European-styled Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-tight",
            textSizeClasses[size]
          )}>
            Linguala
          </span>
          {(size === "lg" || size === "xl") && (
            <span className="text-xs text-gray-600 -mt-1 tracking-widest uppercase font-medium">
              European Translation
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// European-themed icon-only version for favicons and compact displays
export function LingualaIcon({ className }: { className?: string }) {
  return (
    <div className={cn("w-10 h-10 relative", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-lg shadow-md">
        <div className="w-full h-full bg-white rounded-lg m-0.5 flex items-center justify-center">
          <svg
            viewBox="0 0 32 32"
            className="w-6 h-6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="iconEuropeanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E40AF" />
                <stop offset="35%" stopColor="#3730A3" />
                <stop offset="70%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
              <linearGradient id="iconAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            
            {/* Interlocking circles */}
            <circle cx="12" cy="16" r="6" stroke="url(#iconEuropeanGradient)" strokeWidth="2.5" fill="none" opacity="0.8"/>
            <circle cx="20" cy="16" r="6" stroke="url(#iconEuropeanGradient)" strokeWidth="2.5" fill="none" opacity="0.8"/>
            
            {/* Central star */}
            <circle cx="16" cy="16" r="2.5" fill="url(#iconAccentGradient)"/>
            
            {/* Flow indicators */}
            <path d="M6 16 L10 16 M22 16 L26 16" 
              stroke="url(#iconAccentGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
          </svg>
        </div>
      </div>
    </div>
  )
}