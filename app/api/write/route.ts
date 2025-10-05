/**
 * Writing API Route
 * 
 * Handles writing assistance using qwen-flash model:
 * - Text improvement
 * - Word alternatives 
 * - Sentence rephrasing
 */
import { NextRequest, NextResponse } from 'next/server'
import { improveText, getWordAlternatives, rephraseText } from '@/lib/writing-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Processing writing request:', body)
    
    const { text, word, context, operation, correctionsOnly, writingStyle, tone, mode, sourceLang, targetLang } = body

    // Validate required fields based on operation
    if (operation === 'alternatives' && !word) {
      return NextResponse.json(
        { error: 'Word is required for alternatives operation' },
        { status: 400 }
      )
    }

    if ((operation === 'improve' || operation === 'rephrase') && !text) {
      console.log('Missing required field: text')
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    let result

    switch (operation) {
      case 'improve':
        try {
          result = await improveText(text, { correctionsOnly, writingStyle, tone })
        } catch (error) {
          console.error('AI improve service failed:', error)
          return NextResponse.json(
            { error: 'Text improvement service temporarily unavailable' },
            { status: 503 }
          )
        }
        break

      case 'alternatives':
        try {
          result = await getWordAlternatives(word, context, { mode, sourceLang, targetLang })
        } catch (error) {
          console.error('AI alternatives service failed:', error)
          return NextResponse.json(
            { error: 'Word alternatives service temporarily unavailable' },
            { status: 503 }
          )
        }
        break

      case 'rephrase':
        try {
          result = await rephraseText(text)
        } catch (error) {
          console.error('AI rephrase service failed:', error)
          return NextResponse.json(
            { error: 'Text rephrasing service temporarily unavailable' },
            { status: 503 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported: improve, alternatives, rephrase' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Writing processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}