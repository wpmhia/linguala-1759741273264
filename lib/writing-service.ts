/**
 * Writing Service for Linguala Platform
 * 
 * This service uses Alibaba Cloud DashScope's qwen-flash model for writing assistance.
 * Handles text improvement, word alternatives, and sentence rephrasing.
 * 
 * REQUIRED ENVIRONMENT VARIABLE:
 * - DASHSCOPE_API_KEY: Alibaba Cloud API key (format: sk-xxxxxxxxxxxxxxxxx)
 */

// Helper function to strip HTML/markup and normalize text
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')     // Remove HTML tags
    .replace(/\s+/g, ' ')         // Collapse whitespace
    .trim()                       // Remove leading/trailing space
}

// Helper function to estimate token count (rough approximation: 1 token ≈ 4 chars)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Helper function to calculate adaptive max tokens
function getAdaptiveMaxTokens(inputText: string): number {
  const inputTokens = estimateTokens(inputText)
  return Math.ceil(inputTokens * 1.5) + 20
}

export interface WritingResult {
  originalText: string
  improvedText: string
  operation: string
  fallback?: boolean
}

export interface AlternativesResult {
  word: string
  alternatives: string[]
  operation: string
  fallback?: boolean
}

export interface RephraseResult {
  originalText: string
  rephrasedText: string
  rephraseOptions: string[]
  operation: string
  fallback?: boolean
}

// Text improvement function using qwen-flash
export async function improveText(text: string, options: { correctionsOnly?: boolean, writingStyle?: string, tone?: string } = {}): Promise<WritingResult> {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  console.log('Starting qwen-flash API call for text:', text.substring(0, 50))
  
  // Clean text before processing
  const cleanedText = cleanText(text)
  const maxTokens = getAdaptiveMaxTokens(cleanedText)
  
  // Optimized prompt: collapsed into single message, minimal instructions
  let prompt = options.correctionsOnly ? 'Fix:\n' : 'Improve:\n'
  
  // Add style/tone modifiers if specified
  if (options.writingStyle) {
    const styleMap = { simple: 'simple', business: 'business', casual: 'casual', academic: 'formal' }
    prompt += `(${styleMap[options.writingStyle] || options.writingStyle}) `
  }
  
  if (options.tone) {
    prompt += `(${options.tone}) `
  }
  
  prompt += cleanedText
  
  // Add aggressive timeout wrapper
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      console.log('🔥 TIMEOUT: qwen-flash API call timed out after 3 seconds')
      reject(new Error('API call timeout after 3 seconds'))
    }, 3000)
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
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: options.correctionsOnly ? 0.1 : 0.3
      })
    })
    
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
    
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
    throw new Error('Text improvement service unavailable')
  }
}

// Get word alternatives using qwen-flash
export async function getWordAlternatives(word: string, context: string, options: { mode?: string, sourceLang?: string, targetLang?: string } = {}): Promise<AlternativesResult> {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  console.log('Getting alternatives for word:', word)
  
  try {
    // Clean context text
    const cleanedContext = cleanText(context)
    const maxTokens = Math.min(getAdaptiveMaxTokens(`${word} ${cleanedContext}`), 200)
    
    // Optimized prompt: direct instruction, no pleasantries
    const prompt = options.mode === 'translate' 
      ? `5 translations for "${word}" in "${cleanedContext}":\n["` 
      : `5 alternatives for "${word}" in "${cleanedContext}":\n["`
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log('🔥 TIMEOUT: word alternatives API call timed out after 3 seconds')
        reject(new Error('API call timeout after 3 seconds'))
      }, 3000)
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
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
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
    throw new Error('Word alternatives service unavailable')
  }
}

// Rephrase text using qwen-flash
export async function rephraseText(text: string): Promise<RephraseResult> {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  const cleanedText = cleanText(text)
  const maxTokens = getAdaptiveMaxTokens(cleanedText)
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('🔥 TIMEOUT: rephrase API call timed out after 3 seconds')
      controller.abort()
    }, 3000) // 3 second timeout
    
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
            role: 'user',
            content: `3 rephrase options:\n${cleanedText}\n["`
          }
        ],
        max_tokens: maxTokens
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
    throw new Error('Text rephrasing service unavailable')
  }
}

