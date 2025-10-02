import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

/**
 * Check if a user has active premium access
 */
export function isPremiumUser(session: Session | null): boolean {
  if (!session?.user) return false
  
  const user = session.user
  if (!user.isPremium) return false
  
  // If no expiration date, assume permanent premium
  if (!user.premiumExpiresAt) return true
  
  // Check if premium hasn't expired
  return new Date(user.premiumExpiresAt) > new Date()
}

/**
 * Get user's premium status with detailed information
 */
export async function getPremiumStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        premiumExpiresAt: true,
      }
    })

    if (!user) return { isPremium: false, daysRemaining: 0 }

    const isPremium = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())
    const daysRemaining = user.premiumExpiresAt 
      ? Math.max(0, Math.ceil((user.premiumExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : isPremium ? Infinity : 0

    return { isPremium, daysRemaining }
  } catch (error) {
    console.error("Error fetching premium status:", error)
    return { isPremium: false, daysRemaining: 0 }
  }
}

/**
 * Grant premium access to a user
 */
export async function grantPremiumAccess(userId: string, durationDays?: number) {
  try {
    const premiumExpiresAt = durationDays 
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null // null means permanent

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumExpiresAt,
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error granting premium access:", error)
    return { success: false, error: "Failed to grant premium access" }
  }
}

/**
 * Revoke premium access from a user
 */
export async function revokePremiumAccess(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumExpiresAt: null,
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error revoking premium access:", error)
    return { success: false, error: "Failed to revoke premium access" }
  }
}

/**
 * Premium feature limits
 */
export const PREMIUM_LIMITS = {
  FREE: {
    TRANSLATIONS_PER_DAY: 50,
    GLOSSARY_ENTRIES: 100,
    TRANSLATION_HISTORY_DAYS: 7,
    BULK_TRANSLATION_MAX: 10,
  },
  PREMIUM: {
    TRANSLATIONS_PER_DAY: Infinity,
    GLOSSARY_ENTRIES: Infinity,
    TRANSLATION_HISTORY_DAYS: Infinity,
    BULK_TRANSLATION_MAX: 1000,
  }
}

/**
 * Check if user can perform an action based on their premium status
 */
export function canPerformAction(session: Session | null, action: keyof typeof PREMIUM_LIMITS.FREE): boolean {
  const limits = isPremiumUser(session) ? PREMIUM_LIMITS.PREMIUM : PREMIUM_LIMITS.FREE
  return limits[action] === Infinity // For now, just check if it's unlimited
}

/**
 * Get usage limits for a user
 */
export function getUserLimits(session: Session | null) {
  return isPremiumUser(session) ? PREMIUM_LIMITS.PREMIUM : PREMIUM_LIMITS.FREE
}