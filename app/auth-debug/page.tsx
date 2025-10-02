"use client"

import { useEffect, useState } from "react"
import { getProviders } from "next-auth/react"

export default function AuthDebugPage() {
  const [providers, setProviders] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log("Fetching providers...")
        const res = await getProviders()
        console.log("Providers response:", res)
        setProviders(res)
      } catch (err) {
        console.error("Error fetching providers:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [])

  if (loading) return <div className="p-8">Loading providers...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Environment Variables:</h2>
        <pre className="bg-gray-100 p-2 text-sm">
          GOOGLE_CLIENT_ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "Set" : "Not set (this is normal - it's server-side)"}
          NEXTAUTH_URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL || "Not set (using default)"}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Available Providers:</h2>
        <pre className="bg-gray-100 p-2 text-sm">
          {JSON.stringify(providers, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Provider Count:</h2>
        <p>{providers ? Object.keys(providers).length : 0} providers found</p>
      </div>

      {providers?.google && (
        <div className="bg-green-100 p-4 rounded">
          <p className="text-green-800">✅ Google provider is configured!</p>
          <p className="text-sm">ID: {providers.google.id}</p>
          <p className="text-sm">Name: {providers.google.name}</p>
        </div>
      )}

      {!providers?.google && (
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-800">❌ Google provider is NOT configured</p>
          <p className="text-sm">This usually means environment variables are missing</p>
        </div>
      )}
    </div>
  )
}