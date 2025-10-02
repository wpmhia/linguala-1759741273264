"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Mail, Chrome, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { LingualaLogo } from "@/components/ui/linguala-logo"
import Link from "next/link"

function SignInForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [providers, setProviders] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")
  const message = searchParams.get("message")
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError("") // Clear errors when user types
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) return

    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        callbackUrl,
        redirect: false,
      })
      
      if (result?.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          router.push(callbackUrl)
        }, 1500)
      } else {
        console.error("Authentication failed:", result?.error)
        setError("Invalid email or password")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setError("Something went wrong. Please try again.")
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
            Access your translation history, custom glossaries, and premium features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Success! Welcome back to Linguala. Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {message && !showSuccess && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {(error || urlError) && !showSuccess && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error || (urlError ? getErrorMessage(urlError) : "")}
              </AlertDescription>
            </Alert>
          )}

          {/* OAuth Providers */}
          {providers && providers.google && (
            <>
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading || showSuccess}
                className="w-full"
              >
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>

              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-2 text-xs text-gray-500">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Sign In */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={isLoading || showSuccess}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading || showSuccess}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={!formData.email || !formData.password || isLoading || showSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              {showSuccess ? "Success!" : isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800 text-center">
              <strong>New to Linguala?</strong> Create a free account to access premium translation features and custom glossaries!
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