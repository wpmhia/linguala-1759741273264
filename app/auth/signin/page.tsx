"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Mail, Chrome, AlertTriangle, CheckCircle } from "lucide-react"
import { LingualaLogo } from "@/components/ui/linguala-logo"

function SignInForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [providers, setProviders] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      // Try credentials provider first (demo mode)
      const result = await signIn("credentials", {
        email,
        callbackUrl,
        redirect: false,
      })
      
      if (result?.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          router.push(callbackUrl)
        }, 1500)
      } else if (result?.error) {
        // If credentials fail and email provider is available, try email
        if (providers?.email) {
          const emailResult = await signIn("email", {
            email,
            callbackUrl,
            redirect: false,
          })
          if (emailResult?.ok) {
            router.push("/auth/verify-request")
          }
        } else {
          console.error("Authentication failed:", result.error)
        }
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (providerId: string) => {
    setIsLoading(true)
    try {
      const result = await signIn(providerId, { 
        callbackUrl,
        redirect: false 
      })
      
      if (result?.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          window.location.href = callbackUrl
        }, 1500)
      } else if (result?.url) {
        // OAuth redirect
        window.location.href = result.url
      }
    } catch (error) {
      console.error("OAuth sign in error:", error)
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
        return "Error creating account. Please try again."
      case "OAuthAccountNotLinked":
        return "Account not linked. Please sign in with the same method you used before."
      case "EmailSignin":
        return "Error sending email. Please check your email address."
      case "CredentialsSignin":
        return "Invalid credentials. Please check your details."
      case "SessionRequired":
        return "Please sign in to access this page."
      default:
        return "An error occurred during sign in. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LingualaLogo size="lg" />
          </div>
          <CardTitle className="text-2xl font-semibold">Sign In to Linguala</CardTitle>
          <CardDescription>
            Access your translation history, custom glossaries, and professional EU translation tools
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Success! Welcome to Linguala. Redirecting to your dashboard...
              </AlertDescription>
            </Alert>
          )}
          
          {error && !showSuccess && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Sign In */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>
            
            <Button
              type="submit"
              disabled={!email || isLoading || showSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              {showSuccess ? "Success!" : isLoading ? "Processing..." : "Continue with Email"}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                New to Linguala? No account needed - we'll create one for you automatically
              </p>
            </div>
          </form>

          {/* OAuth Providers */}
          {providers && Object.keys(providers).length > 1 && (
            <>
              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-2 text-xs text-gray-500">or continue with</span>
                </div>
              </div>

              <div className="space-y-2">
                {providers.google && (
                  <Button
                    variant="outline"
                    onClick={() => handleOAuthSignIn("google")}
                    disabled={isLoading || showSuccess}
                    className="w-full"
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    Continue with Google
                  </Button>
                )}
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800 text-center">
              <strong>First time here?</strong> Just enter your email or use Google - we'll automatically create your account and unlock all premium features!
            </p>
          </div>
          
          <div className="text-center text-xs text-gray-500 mt-2">
            By continuing, you agree to our terms of service and privacy policy.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
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
      <SignInForm />
    </Suspense>
  )
}