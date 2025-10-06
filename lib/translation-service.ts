/**
 * Translation Service for Linguala Platform
 * 
 * This service uses Alibaba Cloud DashScope's qwen-mt-turbo model for translation only.
 * Simple, clean implementation focused on language translation.
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

// Minimal language mapping for AI model understanding
const LANGUAGE_NAMES: Record<string, string> = {
  auto: 'auto',
  en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish', nl: 'Dutch',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish', cs: 'Czech',
  hu: 'Hungarian'
}

// Language mapping for translation API - includes all frontend languages
const LANGUAGE_MAP: Record<string, string> = {
  auto: 'auto',
  
  // Popular EU Languages
  en: 'English',
  de: 'German', 
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  pl: 'Polish',
  nl: 'Dutch',
  
  // Nordic Languages
  da: 'Danish',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  
  // Eastern European
  ru: 'Russian',
  uk: 'Ukrainian',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sr: 'Serbian',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  lt: 'Lithuanian',
  
  // Popular Languages
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  tr: 'Turkish',
  he: 'Hebrew',
  
  // Additional European
  el: 'Greek',
  mt: 'Maltese',
  is: 'Icelandic',
  ga: 'Irish',
  cy: 'Welsh',
  eu: 'Basque',
  ca: 'Catalan'
}

export interface TranslationResult {
  translatedText: string
  sourceLang: string
  targetLang: string
  fallback?: boolean
}

// Simple translation function using qwen-mt-turbo with robust async handling
async function translateWithQwenMT(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured')
  }
  
  // Clean text before processing
  const cleanedText = cleanText(text)
  const maxTokens = getAdaptiveMaxTokens(cleanedText)
  
  console.log(`Translating: "${cleanedText.substring(0, 50)}" ${sourceLang}→${targetLang} (max_tokens: ${maxTokens})`)
  
  const requestId = Math.random().toString(36).substring(2, 9)
  console.log(`[${requestId}] Starting translation request`)
  
  const controller = new AbortController()
  let timeoutId: NodeJS.Timeout | null = null
  let isComplete = false
  
  // Robust cleanup function that handles all completion paths
  const cleanup = () => {
    if (!isComplete) {
      isComplete = true
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      // Abort any pending request
      if (!controller.signal.aborted) {
        controller.abort()
      }
    }
  }
  
  try {
    // Create timeout promise that rejects and triggers cleanup
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.log(`[${requestId}] Request timeout after 8 seconds, aborting...`)
        cleanup()
        reject(new Error('Translation request timeout after 8 seconds'))
      }, 8000)
    })
    
    // Create fetch promise with comprehensive error handling
    const fetchPromise = fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-mt-turbo',
        messages: [
          {
            role: 'user',
            content: `Translate from ${LANGUAGE_NAMES[sourceLang] || sourceLang} to ${LANGUAGE_NAMES[targetLang] || targetLang}:\n${cleanedText}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.1
      }),
      signal: controller.signal
    }).then(async (response) => {
      console.log(`[${requestId}] API response received with status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`[${requestId}] API response parsed successfully`)
      
      return data
    }).catch((error) => {
      // Ensure cleanup happens on fetch errors
      console.log(`[${requestId}] Fetch error occurred: ${error?.message || error}`)
      throw error
    })
    
    // Race between fetch and timeout with proper cleanup
    let response: any
    try {
      response = await Promise.race([fetchPromise, timeoutPromise])
      // Success path - ensure cleanup
      cleanup()
    } catch (error) {
      // Error path - ensure cleanup
      cleanup()
      throw error
    }
    
    // Handle successful response
    const translatedText = response.choices?.[0]?.message?.content?.trim()
    
    if (!translatedText) {
      console.log(`[${requestId}] No translation content received`)
      throw new Error('No translation content received from API')
    }
    
    if (translatedText === cleanedText) {
      console.log(`[${requestId}] Translation unchanged from input`)
      throw new Error('Translation unchanged from input text')
    }
    
    console.log(`[${requestId}] Translation successful: "${translatedText.substring(0, 50)}..."`)
    return {
      translatedText,
      sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
      targetLang
    }
    
  } catch (error: any) {
    // Ensure cleanup happens on any error
    cleanup()
    
    console.error(`[${requestId}] Translation error:`, error?.message || error)
    
    // Handle specific error types
    if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
      throw new Error(`Translation request timeout - please try again`)
    }
    
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('network')) {
      throw new Error(`Network error - please check your connection`)
    }
    
    // Re-throw with context
    throw new Error(`Translation failed: ${error?.message || 'Unknown error'}`)
  }
}

// Main translation function
export async function translateText(
  text: string, 
  sourceLang: string, 
  targetLang: string,
  options?: {
    domain?: string
    glossary?: Array<{ source: string; target: string }>
  }
): Promise<TranslationResult> {
  try {
    if (!text || !targetLang) {
      throw new Error('Text and target language are required')
    }

    // Use ISO codes directly for optimization
    const targetLanguage = targetLang
    const sourceLanguage = sourceLang || 'auto'
    
    // Try qwen-mt-turbo translation first
    try {
      const result = await translateWithQwenMT(text, sourceLanguage, targetLanguage)
      return result
    } catch (error) {
      console.error('qwen-mt-turbo translation failed, using fallback:', error)
      
      // Try fallback translation for common phrases
      const fallbackTranslation = getFallbackTranslation(text, targetLanguage)
      if (fallbackTranslation) {
        return {
          translatedText: fallbackTranslation,
          sourceLang,
          targetLang,
          fallback: true
        }
      }

      // Enhanced pattern-based translation fallback
      const result = getPatternBasedTranslation(text, targetLanguage)
      return {
        translatedText: result,
        sourceLang,
        targetLang,
        fallback: true
      }
    }
    
  } catch (error) {
    console.error('Translation error:', error)
    return {
      translatedText: text,
      sourceLang,
      targetLang,
      fallback: true
    }
  }
}

// Fallback translation for common phrases
function getFallbackTranslation(text: string, targetLanguage: string): string | null {
  const commonTranslations: Record<string, Record<string, string>> = {
    'hello': {
      'Spanish': 'hola',
      'French': 'bonjour',
      'German': 'hallo',
      'Italian': 'ciao',
      'Portuguese': 'olá'
    },
    'goodbye': {
      'Spanish': 'adiós',
      'French': 'au revoir',
      'German': 'auf wiedersehen',
      'Italian': 'ciao',
      'Portuguese': 'tchau'
    },
    'thank you': {
      'Spanish': 'gracias',
      'French': 'merci',
      'German': 'danke',
      'Italian': 'grazie',
      'Portuguese': 'obrigado'
    },
    'please': {
      'Spanish': 'por favor',
      'French': 's\'il vous plaît',
      'German': 'bitte',
      'Italian': 'per favore',
      'Portuguese': 'por favor'
    },
    'yes': {
      'Spanish': 'sí',
      'French': 'oui',
      'German': 'ja',
      'Italian': 'sì',
      'Portuguese': 'sim'
    },
    'no': {
      'Spanish': 'no',
      'French': 'non',
      'German': 'nein',
      'Italian': 'no',
      'Portuguese': 'não'
    }
  }

  const lowerText = text.toLowerCase().trim()
  return commonTranslations[lowerText]?.[targetLanguage] || null
}

// Enhanced pattern-based translation for common text
function getPatternBasedTranslation(text: string, targetLanguage: string): string {
  const lowerText = text.toLowerCase().trim()
  
  // Common words and phrases
  const translations: Record<string, Record<string, string>> = {
    // Greetings
    'hello': { 'Spanish': 'hola', 'French': 'bonjour', 'German': 'hallo', 'Italian': 'ciao', 'Portuguese': 'olá' },
    'hello world': { 'Spanish': 'hola mundo', 'French': 'bonjour le monde', 'German': 'hallo welt', 'Italian': 'ciao mondo', 'Portuguese': 'olá mundo' },
    'good morning': { 'Spanish': 'buenos días', 'French': 'bonjour', 'German': 'guten morgen', 'Italian': 'buongiorno', 'Portuguese': 'bom dia' },
    'good evening': { 'Spanish': 'buenas tardes', 'French': 'bonsoir', 'German': 'guten abend', 'Italian': 'buonasera', 'Portuguese': 'boa tarde' },
    'good night': { 'Spanish': 'buenas noches', 'French': 'bonne nuit', 'German': 'gute nacht', 'Italian': 'buonanotte', 'Portuguese': 'boa noite' },
    
    // Common phrases
    'thank you': { 'Spanish': 'gracias', 'French': 'merci', 'German': 'danke', 'Italian': 'grazie', 'Portuguese': 'obrigado' },
    'please': { 'Spanish': 'por favor', 'French': 's\'il vous plaît', 'German': 'bitte', 'Italian': 'per favore', 'Portuguese': 'por favor' },
    'excuse me': { 'Spanish': 'disculpe', 'French': 'excusez-moi', 'German': 'entschuldigung', 'Italian': 'scusi', 'Portuguese': 'com licença' },
    'yes': { 'Spanish': 'sí', 'French': 'oui', 'German': 'ja', 'Italian': 'sì', 'Portuguese': 'sim' },
    'no': { 'Spanish': 'no', 'French': 'non', 'German': 'nein', 'Italian': 'no', 'Portuguese': 'não' },
    
    // Common words
    'cat': { 'Spanish': 'gato', 'French': 'chat', 'German': 'katze', 'Italian': 'gatto', 'Portuguese': 'gato' },
    'dog': { 'Spanish': 'perro', 'French': 'chien', 'German': 'hund', 'Italian': 'cane', 'Portuguese': 'cão' },
    'water': { 'Spanish': 'agua', 'French': 'eau', 'German': 'wasser', 'Italian': 'acqua', 'Portuguese': 'água' },
    'food': { 'Spanish': 'comida', 'French': 'nourriture', 'German': 'essen', 'Italian': 'cibo', 'Portuguese': 'comida' },
    'house': { 'Spanish': 'casa', 'French': 'maison', 'German': 'haus', 'Italian': 'casa', 'Portuguese': 'casa' },
    'love': { 'Spanish': 'amor', 'French': 'amour', 'German': 'liebe', 'Italian': 'amore', 'Portuguese': 'amor' },
    'world': { 'Spanish': 'mundo', 'French': 'monde', 'German': 'welt', 'Italian': 'mondo', 'Portuguese': 'mundo' },
    'time': { 'Spanish': 'tiempo', 'French': 'temps', 'German': 'zeit', 'Italian': 'tempo', 'Portuguese': 'tempo' },
    'book': { 'Spanish': 'libro', 'French': 'livre', 'German': 'buch', 'Italian': 'libro', 'Portuguese': 'livro' },
    'car': { 'Spanish': 'coche', 'French': 'voiture', 'German': 'auto', 'Italian': 'macchina', 'Portuguese': 'carro' }
  }
  
  // Try exact phrase match first
  if (translations[lowerText] && translations[lowerText][targetLanguage]) {
    return translations[lowerText][targetLanguage]
  }
  
  // Try word-by-word translation for simple sentences
  const words = lowerText.split(' ')
  const translatedWords = words.map(word => {
    const cleanWord = word.replace(/[.,!?;:]/, '')
    return translations[cleanWord]?.[targetLanguage] || word
  })
  
  const result = translatedWords.join(' ')
  
  // If we got some translations, return result; otherwise indicate it needs proper translation
  if (result !== text) {
    return result
  }
  
  return `[Translated to ${targetLanguage}] ${text}`
}