import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Simple demo credentials provider for development
    CredentialsProvider({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@linguala.eu" }
      },
      async authorize(credentials) {
        // For demo purposes, accept any email
        if (credentials?.email) {
          return {
            id: "demo-user",
            email: credentials.email,
            name: credentials.email.split('@')[0],
            image: null,
          }
        }
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
    
    // GitHub OAuth provider - only enable if credentials are configured
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
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