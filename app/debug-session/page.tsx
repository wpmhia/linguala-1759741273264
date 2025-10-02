"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

export default function DebugSession() {
  const { data: session, status } = useSession()
  const [dbUser, setDbUser] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user/${session.user.id}`)
        .then(res => res.json())
        .then(data => setDbUser(data))
        .catch(err => console.error('Error fetching user:', err))
    }
  }, [session?.user?.id])

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Session Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p>Status: {status}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Data</h2>
          <pre className="text-sm bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Database User</h2>
          <pre className="text-sm bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(dbUser, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}