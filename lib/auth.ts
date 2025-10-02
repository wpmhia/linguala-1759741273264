import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password authentication  
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isPremium: user.isPremium,
          premiumExpiresAt: user.premiumExpiresAt,
        }
      }
    }),
    
    // Google OAuth provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  
  callbacks: {
    async jwt({ token, user }) {
      // Save user data to JWT token on sign in
      if (user) {
        token.id = user.id
        token.isPremium = user.isPremium
        token.premiumExpiresAt = user.premiumExpiresAt
      }
      return token
    },
    async session({ session, token }) {
      // Send token data to the client
      if (token) {
        session.user.id = token.id as string
        session.user.isPremium = token.isPremium as boolean
        session.user.premiumExpiresAt = token.premiumExpiresAt as Date
      }
      return session
    },
  },
  
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`)
    },
  },
}

// Helper function to register new users
export async function registerUser(email: string, password: string, name?: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        isPremium: false, // New users start with free tier
      }
    })

    return { success: true, user: { id: user.id, email: user.email, name: user.name } }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Registration failed" }
  }
}