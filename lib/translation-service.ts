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

    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      console.error('DASHSCOPE_API_KEY not found in environment variables')
      console.error('Please ensure DASHSCOPE_API_KEY is set in .env file')
      console.error('Current value should be: sk-ad9404d1ced5426082b73e685a95ffa3')
      throw new Error('API key not configured. Please set DASHSCOPE_API_KEY environment variable.')
    }
    
    // Log API key status (first 6 chars for security)
    console.log(`Using DashScope API key: ${apiKey.substring(0, 6)}...`)

    // Prepare the translation options
    const sourceLanguage = LANGUAGE_MAP[sourceLang] || (sourceLang === 'auto' ? 'auto' : sourceLang)
    const targetLanguage = LANGUAGE_MAP[targetLang] || targetLang

    // Apply glossary preprocessing if provided
    let processedText = text
    if (options?.glossary && Array.isArray(options.glossary)) {
      options.glossary.forEach((entry: any) => {
        if (entry.source && entry.target) {
          // Simple case-insensitive replacement
          const regex = new RegExp(`\\b${entry.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
          processedText = processedText.replace(regex, `[GLOSSARY:${entry.target}]`)
        }
      })
    }

    // Use DashScope translation API
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-mt-turbo',
        messages: [{
          role: 'user',
          content: processedText
        }],
        translation_options: {
          source_lang: sourceLanguage,
          target_lang: targetLanguage
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('DashScope API error:', response.status, errorData)
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data.choices?.[0]?.message?.content?.trim()

    if (!translatedText) {
      throw new Error('No translation received from API')
    }

    // Clean up the response (remove quotes if the API added them)
    const cleanedTranslation = translatedText.replace(/^["']|["']$/g, '').trim()
    
    return {
      translatedText: cleanedTranslation,
      sourceLang,
      targetLang,
    }
    
  } catch (apiError) {
    console.error('Translation API failed, using fallback:', apiError)
    
    // Fallback to a simple dictionary-based translation for common phrases
    const targetLanguage = LANGUAGE_MAP[targetLang] || targetLang
    const fallbackTranslation = getFallbackTranslation(text, targetLanguage)
    
    return {
      translatedText: fallbackTranslation || `Translation temporarily unavailable for: "${text}"`,
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