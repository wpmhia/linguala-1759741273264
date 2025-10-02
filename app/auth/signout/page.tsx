"use client"

import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Home, LogOut } from "lucide-react"
import { LingualaLogo } from "@/components/ui/linguala-logo"

export default function SignOutPage() {
  const { data: session } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSignedOut, setIsSignedOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: false 
      })
      setIsSignedOut(true)
      // Redirect after a brief delay to show success message
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  // Auto sign out if user is still signed in and visits this page
  useEffect(() => {
    if (session?.user && !isSigningOut && !isSignedOut) {
      handleSignOut()
    }
  }, [session])

  if (isSignedOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <LingualaLogo size="lg" />
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-green-900">
              Successfully Signed Out
            </CardTitle>
            <CardDescription className="text-green-700">
              You have been securely signed out of your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                Your session has been ended and you're being redirected to the home page.
              </p>
            </div>
            
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Translation Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LingualaLogo size="lg" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Sign Out
          </CardTitle>
          <CardDescription>
            {session?.user ? 
              `Are you sure you want to sign out, ${session.user.name || session.user.email}?` :
              "Signing you out..."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {session?.user && !isSigningOut ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  You will lose access to your translation history, custom glossaries, and other premium features until you sign in again.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isSigningOut ? "Signing you out..." : "Loading..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}