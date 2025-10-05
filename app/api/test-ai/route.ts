import { NextResponse } from 'next/server'

export async function GET() {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  if (!DASHSCOPE_API_KEY) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
  }

  console.log('🧪 Testing DashScope API connectivity...')
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('🔥 Test API call timed out after 5 seconds')
      controller.abort()
    }, 5000)
    
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a test assistant. Return only the word "OK".'
          },
          {
            role: 'user',
            content: 'test'
          }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    console.log('✅ DashScope API responded with status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ API Error:', errorText)
      return NextResponse.json({ 
        error: 'API request failed', 
        status: response.status,
        details: errorText 
      }, { status: 500 })
    }

    const data = await response.json()
    console.log('📦 API Response:', data)
    
    return NextResponse.json({ 
      status: 'success',
      message: 'DashScope API is reachable',
      response: data
    })
    
  } catch (error: any) {
    console.log('💥 Test API Error:', error.message)
    return NextResponse.json({ 
      error: 'API test failed', 
      details: error.message 
    }, { status: 500 })
  }
}