import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isPremium?: boolean
      premiumExpiresAt?: Date | null
    }
  }

  interface User {
    id: string
    isPremium?: boolean
    premiumExpiresAt?: Date | null
  }
}