import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DebugPage() {
  const session = await getServerSession(authOptions)
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Server Session Status</h2>
          <p className="mb-4">Status: <span className="font-mono">{session ? 'Authenticated' : 'Not authenticated'}</span></p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Data</h2>
          <pre className="bg-white p-4 rounded border text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• If "Not authenticated": Go to <a href="/auth/signin" className="underline">/auth/signin</a></li>
            <li>• If authenticated but no premium fields: Session callback needs fixing</li>
            <li>• Check premium fields: isPremium, premiumExpiresAt should be present</li>
          </ul>
        </div>
      </div>
    </div>
  )
}