import { NextRequest, NextResponse } from 'next/server'
import { translateText } from '@/lib/translation-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Translation request body:', body)
    
    const { text, sourceLang, targetLang, domain, glossary } = body

    if (!text || !targetLang) {
      console.log('Missing required fields:', { text: !!text, targetLang: !!targetLang })
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      )
    }

    // Use the shared translation service
    const result = await translateText(text, sourceLang, targetLang, {
      domain,
      glossary
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}