import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.DASHSCOPE_API_KEY
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyPrefix: apiKey ? apiKey.substring(0, 10) : 'none'
  })
}

export async function POST() {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY
    console.log('Testing API Key:', apiKey ? apiKey.substring(0, 15) + '...' : 'undefined')
    
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-mt-turbo',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 50
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText, status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ error: error.message })
  }
}