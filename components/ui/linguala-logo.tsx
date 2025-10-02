"use client"

import { cn } from "@/lib/utils"

interface LingualaLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function LingualaLogo({ size = "md", showText = true, className }: LingualaLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl", 
    xl: "text-3xl"
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Logo Icon - Modern geometric design */}
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Outer ring with gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-0.5">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
            {/* Inner symbol - Abstract "L" that looks like translation arrows */}
            <svg
              viewBox="0 0 24 24"
              className="w-3/4 h-3/4 text-transparent"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              
              {/* Stylized "L" with translation flow */}
              <path
                d="M6 4v12h4m0 0l3-3m-3 3l3 3m2-7h6m-2-2l2 2m-2 2l2-2"
                stroke="url(#logoGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-sm"
              />
              
              {/* Accent dots for movement */}
              <circle cx="9" cy="8" r="1" fill="url(#logoGradient)" opacity="0.6" />
              <circle cx="15" cy="12" r="1" fill="url(#logoGradient)" opacity="0.6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent tracking-tight",
            textSizeClasses[size]
          )}>
            Linguala
          </span>
          {size === "xl" && (
            <span className="text-xs text-gray-500 -mt-1 tracking-widest uppercase">
              European Translation
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Simple icon-only version for favicons
export function LingualaIcon({ className }: { className?: string }) {
  return (
    <div className={cn("w-8 h-8 relative", className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-0.5">
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <path
              d="M6 4v12h4m0 0l3-3m-3 3l3 3m2-7h6m-2-2l2 2m-2 2l2-2"
              stroke="url(#iconGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="8" r="1" fill="url(#iconGradient)" opacity="0.6" />
            <circle cx="15" cy="12" r="1" fill="url(#iconGradient)" opacity="0.6" />
          </svg>
        </div>
      </div>
    </div>
  )
}