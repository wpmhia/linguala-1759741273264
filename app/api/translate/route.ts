/**
 * Translation API Route
 * 
 * Handles language translation ONLY using qwen-mt-turbo model.
 * Clean, simple implementation focused on translation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { translateText } from '@/lib/translation-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Processing translation request:', body)
    
    const { text, sourceLang, targetLang, domain, glossary } = body

    // Validate required fields
    if (!text) {
      console.log('Missing required field: text')
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!targetLang) {
      return NextResponse.json(
        { error: 'Target language is required for translation' },
        { status: 400 }
      )
    }

    // Perform translation
    const result = await translateText(text, sourceLang, targetLang, { domain, glossary })
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Translation processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}