"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { LingualaLogo } from "@/components/ui/linguala-logo"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Configuration Error",
          description: "There is a problem with the server configuration. Please contact support.",
          suggestion: "This is likely a temporary issue. Please try again later."
        }
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You do not have permission to sign in with this account.",
          suggestion: "Please try with a different account or contact support if you believe this is an error."
        }
      case "Verification":
        return {
          title: "Email Verification Failed",
          description: "The verification link is invalid or has expired.",
          suggestion: "Please request a new verification email."
        }
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        return {
          title: "OAuth Authentication Error",
          description: "There was an error with Google sign-in.",
          suggestion: "Please check your Google account settings and try again."
        }
      case "EmailCreateAccount":
        return {
          title: "Account Creation Failed",
          description: "Unable to create your account with this email address.",
          suggestion: "Please try with a different email or contact support."
        }
      case "Callback":
        return {
          title: "Authentication Callback Error",
          description: "There was an error processing your authentication request.",
          suggestion: "Please try signing in again."
        }
      case "CredentialsSignin":
        return {
          title: "Invalid Credentials",
          description: "The email you entered doesn't match our records.",
          suggestion: "Please check your email address and try again."
        }
      case "SessionRequired":
        return {
          title: "Authentication Required", 
          description: "You need to be signed in to access this page.",
          suggestion: "Please sign in to continue."
        }
      default:
        return {
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication.",
          suggestion: "Please try again or contact support if the problem persists."
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LingualaLogo size="lg" />
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-red-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-red-700">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>What you can do:</strong><br />
              {errorInfo.suggestion}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </div>

          {error && (
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600 break-all">
                Error Code: {error}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}