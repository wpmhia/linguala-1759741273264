/**
 * Shared Translation Service for Linguala Platform
 * 
 * This service uses Alibaba Cloud DashScope's Qwen translation model for high-quality translations.
 * 
 * REQUIRED ENVIRONMENT VARIABLE:
 * - DASHSCOPE_API_KEY: Alibaba Cloud API key (format: sk-xxxxxxxxxxxxxxxxx)
 *   Get from: https://bailian.console.aliyun.com/ → Model Studio → Create API Key
 *   This key is already configured in .env file: sk-ad9404d1ced5426082b73e685a95ffa3
 * 
 * USAGE:
 * - translateText(): For single text translation (used by main translator)
 * - translateLongText(): For document translation with chunking (used by document processor)
 * 
 * FALLBACK: If API fails, falls back to dictionary-based translations for common phrases
 */

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
  
  // Nordic EU Languages
  da: 'Danish',
  sv: 'Swedish',
  fi: 'Finnish',
  no: 'Norwegian',
  
  // Major World Languages
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  tr: 'Turkish',
  th: 'Thai',
  vi: 'Vietnamese',
  
  // Other EU Languages
  ga: 'Irish',
  mt: 'Maltese',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  sl: 'Slovenian',
  hr: 'Croatian',
  bg: 'Bulgarian',
  ro: 'Romanian',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian',
  el: 'Greek',
}

// Fallback translation for common phrases
function getFallbackTranslation(text: string, targetLanguage: string): string | null {
  const lowerText = text.toLowerCase().trim()
  
  const commonPhrases: Record<string, Record<string, string>> = {
    'hello': {
      'Danish': 'Hej',
      'Swedish': 'Hej', 
      'Norwegian': 'Hei',
      'Finnish': 'Hei',
      'German': 'Hallo',
      'French': 'Bonjour',
      'Spanish': 'Hola',
      'Italian': 'Ciao',
      'Portuguese': 'Olá',
      'Dutch': 'Hallo',
      'Polish': 'Cześć',
      'Russian': 'Привет'
    },
    'good morning': {
      'Danish': 'God morgen',
      'Swedish': 'God morgon',
      'Norwegian': 'God morgen', 
      'Finnish': 'Hyvää huomenta',
      'German': 'Guten Morgen',
      'French': 'Bonjour',
      'Spanish': 'Buenos días',
      'Dutch': 'Goedemorgen'
    },
    'thank you': {
      'Danish': 'Tak',
      'Swedish': 'Tack',
      'Norwegian': 'Takk',
      'Finnish': 'Kiitos',
      'German': 'Danke',
      'French': 'Merci',
      'Spanish': 'Gracias',
      'Dutch': 'Dank je'
    }
  }
  
  for (const [phrase, translations] of Object.entries(commonPhrases)) {
    if (lowerText.includes(phrase)) {
      return translations[targetLanguage] || null
    }
  }
  
  return null
}

// Main Qwen3 translation function
async function translateWithQwen3Max(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
  
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured')
  }
  
  console.log(`Translating with Qwen3: "${text.substring(0, 50)}" from ${sourceLang} to ${targetLang}`)
  
  // Build prompt for qwen-mt-turbo (which doesn't support system role)
  let userPrompt = ''
  
  if (sourceLang === 'auto') {
    userPrompt = `Translate to ${targetLang}: ${text}`
  } else {
    userPrompt = `Translate from ${sourceLang} to ${targetLang}: ${text}`
  }
  
  try {
    // Simple direct fetch with AbortController timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
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
            content: userPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    console.log('Qwen3 translation response received:', response.status)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data.choices[0]?.message?.content?.trim()

    if (translatedText && translatedText !== text) {
      return {
        translatedText,
        sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
        targetLang
      }
    } else {
      throw new Error('No translation received or same as input')
    }
  } catch (error) {
    console.error('Qwen3 translation error:', error)
    throw error
  }
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

export interface TranslationResult {
  translatedText: string
  sourceLang: string
  targetLang: string
  fallback?: boolean
}

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

    // Prepare the translation options
    const targetLanguage = LANGUAGE_MAP[targetLang] || targetLang
    const sourceLanguage = sourceLang && sourceLang !== 'auto' ? LANGUAGE_MAP[sourceLang] || sourceLang : 'auto'
    
    // Try Qwen3 translation first
    try {
      const result = await translateWithQwen3Max(text, sourceLanguage, targetLanguage)
      return result
    } catch (error) {
      console.error('Qwen3 translation failed, using fallback:', error)
      
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
      translatedText: `Translation error: ${text}`,
      sourceLang,
      targetLang,
      fallback: true
    }
  }
}

/**
 * Verify DashScope API configuration
 * Checks if API key is properly configured and accessible
 */
export function verifyApiConfiguration(): { configured: boolean; keyPreview?: string; error?: string } {
  const apiKey = process.env.DASHSCOPE_API_KEY
  
  if (!apiKey) {
    return {
      configured: false,
      error: 'DASHSCOPE_API_KEY not found in environment variables. Please set it in .env file.'
    }
  }
  
  if (!apiKey.startsWith('sk-')) {
    return {
      configured: false,
      error: 'Invalid API key format. DashScope API keys should start with "sk-"'
    }
  }
  
  return {
    configured: true,
    keyPreview: `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`
  }
}

export async function translateLongText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  // Split long text into chunks to handle API limits
  const MAX_CHUNK_SIZE = 4000 // Conservative limit for translation API
  const chunks: string[] = []
  
  // Split by paragraphs first
  const paragraphs = text.split('\n\n').filter(p => p.trim())
  
  let currentChunk = ''
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  // Translate each chunk
  const translatedChunks: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Translating chunk ${i + 1}/${chunks.length}`)
    try {
      const result = await translateText(chunks[i], sourceLang, targetLang)
      translatedChunks.push(result.translatedText)
      
      // Add small delay to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`Error translating chunk ${i + 1}:`, error)
      // Use original text as fallback
      translatedChunks.push(chunks[i])
    }
  }

  return translatedChunks.join('\n\n')
}