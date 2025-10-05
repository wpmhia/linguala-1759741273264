/**
 * Writing API Route
 * 
 * Handles writing assistance using qwen-flash model:
 * - Text improvement
 * - Word alternatives 
 * - Sentence rephrasing
 */
import { NextRequest, NextResponse } from 'next/server'

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
        // Temporary fallback response for testing
        result = {
          originalText: text,
          improvedText: text + " (improved)",
          operation: 'improve',
          fallback: true
        }
        break

      case 'alternatives':
        // Temporary fallback response for testing
        result = {
          word: word,
          alternatives: [word + "1", word + "2", word + "3"],
          operation: 'alternatives',
          fallback: true
        }
        break

      case 'rephrase':
        // Temporary fallback response for testing
        result = {
          originalText: text,
          rephrasedText: "This is a rephrased version: " + text,
          rephraseOptions: ["Option 1: " + text, "Option 2: " + text],
          operation: 'rephrase',
          fallback: true
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