import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  // Comment out adapter for JWT session strategy
  // adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email-based account creation (no password needed)
    CredentialsProvider({
      name: "Email Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" }
      },
      async authorize(credentials) {
        console.log("Credentials provider called with:", credentials)
        
        // Accept any valid email and create account automatically
        if (credentials?.email && credentials.email.includes('@')) {
          const emailParts = credentials.email.split('@')
          const username = emailParts[0]
          const domain = emailParts[1]
          
          const user = {
            id: `email_${credentials.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: credentials.email,
            name: username.charAt(0).toUpperCase() + username.slice(1),
            image: null,
          }
          
          console.log("Creating user:", user)
          return user
        }
        
        console.log("Invalid email provided:", credentials?.email)
        return null
      }
    }),
    
    // Email provider - only enable if SMTP is configured
    ...(process.env.EMAIL_SERVER_HOST ? [
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      })
    ] : []),
    
    // Google OAuth provider - only enable if credentials are configured
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
    verifyRequest: '/auth/verify-request',
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // For new OAuth users, generate a consistent ID
        if (account?.provider === 'google') {
          token.id = `google_${user.id}`
        } else if (account?.provider === 'credentials') {
          token.id = user.id
        } else {
          token.id = user.id || `user_${Date.now()}`
        }
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string
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