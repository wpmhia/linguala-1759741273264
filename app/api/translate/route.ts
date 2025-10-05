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
    
    const { text, word, context, operation = 'translate', sourceLang, targetLang, domain, glossary, mode } = body

    // Validate required fields based on operation
    if (operation === 'alternatives' && !word) {
      return NextResponse.json(
        { error: 'Word is required for alternatives operation' },
        { status: 400 }
      )
    }

    if ((operation === 'translate' || operation === 'improve' || operation === 'rephrase') && !text) {
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
        const { correctionsOnly, writingStyle, tone } = body
        result = await improveWritingWithQwen3Max(text, { correctionsOnly, writingStyle, tone })
        break

      case 'alternatives':
        result = await getWordAlternativesWithQwen3Max(word, context, { mode, sourceLang, targetLang })
        break

      case 'rephrase':
        result = await rephraseTextWithQwen3Max(text)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported: translate, improve, alternatives, rephrase' },
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

// Text improvement function using qwen-flash
async function improveWritingWithQwen3Max(text: string, options: { correctionsOnly?: boolean, writingStyle?: string, tone?: string } = {}) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  console.log('Starting qwen-flash API call for text:', text.substring(0, 50))
  console.log('Improvement options:', options)
  
  // Build system prompt based on options
  let systemPrompt = 'You are a professional writing assistant. '
  
  if (options.correctionsOnly) {
    systemPrompt += 'Focus ONLY on correcting grammar, spelling, and punctuation errors. Do not change the style, tone, or word choice unless there are clear errors. '
  } else {
    systemPrompt += 'Improve the given text by enhancing clarity, grammar, style, and readability while maintaining the original meaning. '
    
    if (options.writingStyle) {
      switch (options.writingStyle) {
        case 'simple':
          systemPrompt += 'Use simple, clear language that is easy to understand. '
          break
        case 'business':
          systemPrompt += 'Use professional, formal business language. '
          break
        case 'casual':
          systemPrompt += 'Use casual, conversational language. '
          break
        case 'academic':
          systemPrompt += 'Use formal, academic language with precise terminology. '
          break
      }
    }
    
    if (options.tone) {
      switch (options.tone) {
        case 'friendly':
          systemPrompt += 'Maintain a warm, friendly tone. '
          break
        case 'professional':
          systemPrompt += 'Maintain a professional, courteous tone. '
          break
        case 'enthusiastic':
          systemPrompt += 'Maintain an enthusiastic, energetic tone. '
          break
        case 'diplomatic':
          systemPrompt += 'Maintain a diplomatic, tactful tone. '
          break
      }
    }
  }
  
  systemPrompt += 'Return only the improved text without explanations, quotes, or additional commentary.'
  
  // Add timeout wrapper
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('API call timeout after 10 seconds')), 10000)
  })
  
  try {
    const fetchPromise = fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: options.correctionsOnly ? 0.1 : 0.3
      })
    })
    
    console.log('Waiting for API response...')
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
    console.log('API response received:', response.status)
    
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

// Text rephrasing function using qwen-flash
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
        model: 'qwen-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a professional writing assistant. Provide 3 different ways to rephrase the given text using different words and sentence structures while keeping the same meaning. Make them sound natural and engaging. Return only a JSON array of rephrased options, like: ["option1", "option2", "option3"]'
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
    const content = data.choices[0]?.message?.content?.trim()
    
    // Try to parse JSON response
    let rephraseOptions: string[] = []
    try {
      rephraseOptions = JSON.parse(content)
    } catch {
      // Fallback: treat as single option
      rephraseOptions = [content]
    }

    return {
      originalText: text,
      rephrasedText: rephraseOptions[0] || text,
      rephraseOptions: rephraseOptions.filter(option => option && option !== text),
      operation: 'rephrase'
    }
  } catch (error) {
    console.error('Rephrase text error:', error)
    // Enhanced fallback - multiple rephrase options
    const option1 = text
      .replace(/\bvery\b/g, 'extremely')
      .replace(/\bgood\b/g, 'excellent')
      .replace(/\bbad\b/g, 'poor')
      .replace(/\bnice\b/g, 'pleasant')
      .replace(/\bbig\b/g, 'large')
    
    const option2 = text
      .replace(/I think/g, 'I believe')
      .replace(/It is important/g, 'It is essential')
      .replace(/In my opinion/g, 'From my perspective')
      .replace(/very important/g, 'crucial')
      
    const option3 = text
      .replace(/\breally\b/g, 'truly')
      .replace(/\bshould\b/g, 'ought to')
      .replace(/\bwant to\b/g, 'wish to')
      .replace(/\bneed to\b/g, 'must')
    
    const rephraseOptions = [option1, option2, option3].filter(option => option !== text)
    
    return {
      originalText: text,
      rephrasedText: rephraseOptions[0] || text,
      rephraseOptions: rephraseOptions,
      operation: 'rephrase',
      fallback: true
    }
  }
}

// Word alternatives function using qwen-flash
async function getWordAlternativesWithQwen3Max(word: string, context: string, options: { mode?: string, sourceLang?: string, targetLang?: string } = {}) {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  console.log('Getting alternatives for word:', word)
  
  try {
    let systemPrompt = 'You are a professional writing assistant. '
    
    if (options.mode === 'translate') {
      systemPrompt += `Provide 5 alternative translations or synonyms for the word "${word}" in the context: "${context}". `
      if (options.targetLang) {
        systemPrompt += `Focus on translations that work well in ${options.targetLang}. `
      }
    } else {
      systemPrompt += `Provide 5 alternative words or synonyms for "${word}" in the context: "${context}". Focus on words that improve clarity, style, and readability. `
    }
    
    systemPrompt += 'Return only a JSON array of alternative words, like: ["alternative1", "alternative2", "alternative3", "alternative4", "alternative5"]'
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timeout after 8 seconds')), 8000)
    })
    
    const fetchPromise = fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Word: "${word}"\nContext: "${context}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    })
    
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    
    // Try to parse JSON response
    let alternatives: string[] = []
    try {
      alternatives = JSON.parse(content)
    } catch {
      // Fallback: extract words from text response
      const words = content.match(/[\w']+/g) || []
      alternatives = words.slice(0, 5)
    }
    
    return {
      word,
      alternatives: alternatives.filter(alt => alt.toLowerCase() !== word.toLowerCase()).slice(0, 5),
      operation: 'alternatives'
    }
  } catch (error) {
    console.error('Get alternatives error:', error)
    
    // Enhanced fallback alternatives
    const fallbackAlternatives = getFallbackAlternatives(word)
    
    return {
      word,
      alternatives: fallbackAlternatives,
      operation: 'alternatives',
      fallback: true
    }
  }
}

// Enhanced fallback alternatives
function getFallbackAlternatives(word: string): string[] {
  const alternatives: Record<string, string[]> = {
    'good': ['great', 'excellent', 'wonderful', 'fantastic', 'superb'],
    'bad': ['poor', 'terrible', 'awful', 'horrible', 'dreadful'],
    'big': ['large', 'huge', 'massive', 'enormous', 'gigantic'],
    'small': ['tiny', 'little', 'compact', 'miniature', 'petite'],
    'fast': ['quick', 'rapid', 'swift', 'speedy', 'brisk'],
    'slow': ['gradual', 'leisurely', 'sluggish', 'unhurried', 'steady'],
    'important': ['crucial', 'vital', 'essential', 'significant', 'critical'],
    'beautiful': ['gorgeous', 'stunning', 'lovely', 'attractive', 'magnificent'],
    'happy': ['joyful', 'cheerful', 'delighted', 'pleased', 'elated'],
    'sad': ['unhappy', 'sorrowful', 'melancholy', 'dejected', 'gloomy'],
    'very': ['extremely', 'incredibly', 'remarkably', 'exceptionally', 'tremendously'],
    'really': ['truly', 'genuinely', 'actually', 'indeed', 'certainly'],
    'said': ['stated', 'mentioned', 'declared', 'expressed', 'remarked'],
    'make': ['create', 'produce', 'build', 'construct', 'generate'],
    'think': ['believe', 'consider', 'suppose', 'assume', 'reckon'],
    'know': ['understand', 'realize', 'recognize', 'comprehend', 'grasp'],
    'help': ['assist', 'support', 'aid', 'guide', 'facilitate'],
    'work': ['function', 'operate', 'perform', 'labor', 'serve'],
    'easy': ['simple', 'effortless', 'straightforward', 'uncomplicated', 'manageable'],
    'hard': ['difficult', 'challenging', 'tough', 'demanding', 'complex']
  }
  
  return alternatives[word.toLowerCase()] || []
}

// Text summarization function using qwen-flash
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
        model: 'qwen-flash',
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