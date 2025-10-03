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
        result = await improveWritingWithQwen3Max(text)
        break

      case 'rephrase':
        result = await rephraseTextWithQwen3Max(text)
        break

      case 'summarize':
        result = await summarizeTextWithQwen3Max(text)
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

// Improved writing fallback with multilingual support
async function improveWritingFallback(text: string) {
  // Enhanced fallback - basic grammar and style improvements
  const basicImprovement = text
    // Dutch grammar fixes
    .replace(/\bik leest\b/gi, 'ik lees')
    .replace(/\bIk leest\b/g, 'Ik lees')
    .replace(/\bjij heeft\b/gi, 'jij hebt')
    .replace(/\bJij heeft\b/g, 'Jij hebt')
    .replace(/\bhij hebben\b/gi, 'hij heeft')
    .replace(/\bHij hebben\b/g, 'Hij heeft')
    .replace(/\bzij hebben\b/gi, 'zij heeft')
    .replace(/\bZij hebben\b/g, 'Zij heeft')
    // English grammar fixes
    .replace(/\bi\b/gi, 'I')
    .replace(/\bim\b/gi, "I'm")
    .replace(/\bits\b/gi, "it's")
    .replace(/\byour\b(?=\s+(going|coming|feeling))/gi, "you're")
    .replace(/\bwont\b/gi, "won't")
    .replace(/\bdont\b/gi, "don't")
    .replace(/\bcant\b/gi, "can't")
    .replace(/\bwere\b(?=\s+going)/gi, "we're")
    .replace(/\btheir\b(?=\s+(happy|sad|coming|going))/gi, "they're")
    // Fix double spaces
    .replace(/\s+/g, ' ')
    // Capitalize first letter
    .replace(/^[a-z]/, match => match.toUpperCase())
    // Fix sentence endings
    .replace(/([a-z])\s*$/i, '$1.')
    .trim()
  
  return {
    originalText: text,
    improvedText: basicImprovement,
    operation: 'improve',
    fallback: true
  }
}

// Text improvement function using qwen-max
async function improveWritingWithQwen3Max(text: string) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  try {
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          {
            role: 'system',
            content: 'You are a professional writing assistant. Improve the given text by enhancing clarity, grammar, style, and readability while maintaining the original meaning and tone. Fix any grammatical errors, improve word choice, and enhance sentence structure. Return only the improved text without explanations or quotes.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const improvedText = data.choices[0]?.message?.content?.trim()

    if (improvedText && improvedText !== text) {
      return {
        originalText: text,
        improvedText,
        operation: 'improve'
      }
    } else {
      throw new Error('No improvement received')
    }
  } catch (error) {
    console.error('Improve writing error:', error)
    // Enhanced fallback - basic grammar and style improvements
    const basicImprovement = text
      // Dutch grammar fixes
      .replace(/\bik leest\b/gi, 'ik lees')
      .replace(/\bIk leest\b/g, 'Ik lees')
      .replace(/\bjij heeft\b/gi, 'jij hebt')
      .replace(/\bJij heeft\b/g, 'Jij hebt')
      .replace(/\bhij hebben\b/gi, 'hij heeft')
      .replace(/\bHij hebben\b/g, 'Hij heeft')
      .replace(/\bzij hebben\b/gi, 'zij heeft')
      .replace(/\bZij hebben\b/g, 'Zij heeft')
      // English grammar fixes
      .replace(/\bi\b/gi, 'I')
      .replace(/\bim\b/gi, "I'm")
      .replace(/\bits\b/gi, "it's")
      .replace(/\byour\b(?=\s+(going|coming|feeling))/gi, "you're")
      .replace(/\bwont\b/gi, "won't")
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bwere\b(?=\s+going)/gi, "we're")
      .replace(/\btheir\b(?=\s+(happy|sad|coming|going))/gi, "they're")
      // Fix double spaces
      .replace(/\s+/g, ' ')
      // Capitalize first letter
      .replace(/^[a-z]/, match => match.toUpperCase())
      // Fix sentence endings
      .replace(/([a-z])\s*$/i, '$1.')
      .trim()
    
    return {
      originalText: text,
      improvedText: basicImprovement,
      operation: 'improve',
      fallback: true
    }
  }
}

// Text rephrasing function using qwen-max
async function rephraseTextWithQwen3Max(text: string) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
    
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-max',
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

// Text summarization function using qwen-max
async function summarizeTextWithQwen3Max(text: string) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  try {
    // Create a race condition between the API call and timeout
    const apiCall = fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          {
            role: 'system',
            content: 'You are a professional text summarizer. Create a concise summary of the given text that captures the main points and key information. Keep it clear and well-structured. Return only the summary without explanations or quotes.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })

    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    )

    const response = await Promise.race([apiCall, timeout]) as Response
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const summaryText = data.choices[0]?.message?.content?.trim()

    if (summaryText && summaryText !== text) {
      return {
        originalText: text,
        summaryText,
        operation: 'summarize'
      }
    } else {
      throw new Error('No summary received')
    }
  } catch (error) {
    console.error('Summarize text error:', error)
    // Smart fallback summarization
    const sentences = text.match(/[^.!?]+[.!?]+/g) || []
    
    if (sentences.length === 0 || text.length <= 100) {
      return {
        originalText: text,
        summaryText: text,
        operation: 'summarize',
        fallback: true
      }
    }

    // Take first 1-2 sentences or up to 40% of original length
    const targetLength = Math.max(Math.floor(text.length * 0.4), 80)
    let summary = ''
    let sentenceCount = 0
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (summary.length + trimmedSentence.length <= targetLength && sentenceCount < 3) {
        summary += (summary ? ' ' : '') + trimmedSentence
        sentenceCount++
      } else {
        break
      }
    }
    
    return {
      originalText: text,
      summaryText: summary || text.substring(0, Math.min(100, text.length)) + '...',
      operation: 'summarize',
      fallback: true
    }
  }
}