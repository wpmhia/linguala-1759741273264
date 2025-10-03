/**
 * Text Processing API Route
 * 
 * Handles text translation, improvement, rephrasing, and summarization using DashScope API.
 * ENVIRONMENT: DASHSCOPE_API_KEY must be set (currently: sk-ad9404d1ced5426082b73e685a95ffa3)
 */
import { NextRequest, NextResponse } from 'next/server'
import { translateText } from '@/lib/translation-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Processing request body:', body)
    
    const { text, operation = 'translate', sourceLang, targetLang, domain, glossary } = body

    if (!text) {
      console.log('Missing required field: text')
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    let result

    switch (operation) {
      case 'translate':
        if (!targetLang) {
          return NextResponse.json(
            { error: 'Target language is required for translation' },
            { status: 400 }
          )
        }
        result = await translateText(text, sourceLang, targetLang, { domain, glossary })
        break

      case 'improve':
        // Use fallback for now due to API reliability issues
        result = {
          originalText: text,
          improvedText: text
            .replace(/\bi\b/g, 'I')
            .replace(/\bim\b/g, 'I\'m')
            .replace(/\bits\b/g, 'it\'s')
            .replace(/\byour\b/g, 'you\'re')
            .replace(/\bwont\b/g, 'won\'t')
            .replace(/\bdont\b/g, 'don\'t')
            .replace(/\bcant\b/g, 'can\'t')
            .replace(/\s+/g, ' ')
            .trim(),
          operation: 'improve',
          fallback: true
        }
        break

      case 'rephrase':
        // Use fallback for now due to API reliability issues
        result = {
          originalText: text,
          rephrasedText: text
            .replace(/\bvery\b/g, 'extremely')
            .replace(/\bgood\b/g, 'excellent')
            .replace(/\bbad\b/g, 'poor')
            .replace(/\bnice\b/g, 'pleasant')
            .replace(/\bbig\b/g, 'large')
            .replace(/\bsmall\b/g, 'tiny')
            .replace(/\bfast\b/g, 'quick')
            .replace(/\bslow\b/g, 'sluggish'),
          operation: 'rephrase',
          fallback: true
        }
        break

      case 'summarize':
        // Use fallback for now due to API reliability issues
        const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text]
        const targetLength = Math.max(Math.floor(text.length * 0.4), 50)
        let summary = ''
        
        for (const sentence of sentences) {
          if (summary.length + sentence.length <= targetLength) {
            summary += sentence.trim() + ' '
          } else {
            break
          }
        }
        
        result = {
          originalText: text,
          summaryText: summary.trim() || (text.length > 100 ? text.substring(0, 100) + '...' : text),
          operation: 'summarize',
          fallback: true
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported: translate, improve, rephrase, summarize' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Text improvement function
async function improveWriting(text: string) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional writing assistant. Improve the given text by enhancing clarity, grammar, style, and readability while maintaining the original meaning. Return only the improved text without explanations.'
          },
          {
            role: 'user',
            content: text
          }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const improvedText = data.choices[0]?.message?.content?.trim()

    return {
      originalText: text,
      improvedText: improvedText || text,
      operation: 'improve'
    }
  } catch (error) {
    console.error('Improve writing error:', error)
    // Simple fallback - basic grammar improvements
    const basicImprovement = text
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/g, 'I\'m')
      .replace(/\bits\b/g, 'it\'s')
      .replace(/\byour\b/g, 'you\'re')
      .replace(/\s+/g, ' ')
      .trim()
    
    return {
      originalText: text,
      improvedText: basicImprovement,
      operation: 'improve',
      fallback: true
    }
  }
}

// Text rephrasing function
async function rephraseText(text: string) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional writing assistant. Rephrase the given text using different words and sentence structures while keeping the same meaning. Make it sound natural and engaging. Return only the rephrased text without explanations.'
          },
          {
            role: 'user',
            content: text
          }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const rephrasedText = data.choices[0]?.message?.content?.trim()

    return {
      originalText: text,
      rephrasedText: rephrasedText || text,
      operation: 'rephrase'
    }
  } catch (error) {
    console.error('Rephrase text error:', error)
    // Simple fallback - basic rephrasing
    const basicRephrase = text
      .replace(/\bvery\b/g, 'extremely')
      .replace(/\bgood\b/g, 'excellent')
      .replace(/\bbad\b/g, 'poor')
      .replace(/\bnice\b/g, 'pleasant')
      .replace(/\bbig\b/g, 'large')
    
    return {
      originalText: text,
      rephrasedText: basicRephrase,
      operation: 'rephrase',
      fallback: true
    }
  }
}

// Text summarization function
async function summarizeText(text: string) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional summarization assistant. Create a concise summary of the given text that captures the main points and key information. Keep it clear and well-structured. Return only the summary without explanations.'
          },
          {
            role: 'user',
            content: text
          }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const summaryText = data.choices[0]?.message?.content?.trim()

    return {
      originalText: text,
      summaryText: summaryText || text,
      operation: 'summarize'
    }
  } catch (error) {
    console.error('Summarize text error:', error)
    // Simple fallback - take first sentences up to ~50% of length
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text]
    const targetLength = Math.max(Math.floor(text.length * 0.3), 50)
    let summary = ''
    
    for (const sentence of sentences) {
      if (summary.length + sentence.length <= targetLength) {
        summary += sentence
      } else {
        break
      }
    }
    
    return {
      originalText: text,
      summaryText: summary || text.substring(0, targetLength) + '...',
      operation: 'summarize',
      fallback: true
    }
  }
}