/**
 * Writing Service for Linguala Platform
 * 
 * This service uses Alibaba Cloud DashScope's qwen-flash model for writing assistance.
 * Handles text improvement, word alternatives, and sentence rephrasing.
 * 
 * REQUIRED ENVIRONMENT VARIABLE:
 * - DASHSCOPE_API_KEY: Alibaba Cloud API key (format: sk-xxxxxxxxxxxxxxxxx)
 */

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
  
  // Build dynamic system prompt based on options
  let systemPrompt = 'You are a professional writing assistant. '
  
  if (options.correctionsOnly) {
    systemPrompt += 'Focus ONLY on correcting grammar, spelling, and punctuation errors. Do not change the style, tone, or meaning of the text. '
  } else {
    systemPrompt += 'Improve the text for clarity, readability, and engagement while maintaining the original meaning. '
    
    // Add writing style guidance
    if (options.writingStyle) {
      switch (options.writingStyle) {
        case 'simple':
          systemPrompt += 'Use simple, clear language that is easy to understand. Avoid complex words and long sentences. '
          break
        case 'business':
          systemPrompt += 'Use professional, business-appropriate language. Be concise and direct. '
          break
        case 'casual':
          systemPrompt += 'Use a relaxed, conversational tone. Make it sound natural and friendly. '
          break
        case 'academic':
          systemPrompt += 'Use formal, academic language with precise terminology and structured arguments. '
          break
      }
    }
    
    // Add tone guidance
    if (options.tone) {
      switch (options.tone) {
        case 'friendly':
          systemPrompt += 'Maintain a warm and approachable tone. '
          break
        case 'professional':
          systemPrompt += 'Keep a professional and authoritative tone. '
          break
        case 'enthusiastic':
          systemPrompt += 'Add energy and enthusiasm to the text. '
          break
        case 'diplomatic':
          systemPrompt += 'Use diplomatic and tactful language. '
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
      .replace(/\bI\s+am\s+going\s+to\s+went\b/gi, 'I am going to go')
      .replace(/\bYou\s+was\b/gi, 'You were')
      .replace(/\bHe\s+don't\b/gi, 'He doesn\'t')
      .replace(/\bShe\s+don't\b/gi, 'She doesn\'t')
      .replace(/\bthere\s+house\b/gi, 'their house')
      .replace(/\byour\s+welcome\b/gi, 'you\'re welcome')
      .replace(/\bits\s+a\s+beautiful\s+day\b/gi, 'it\'s a beautiful day')
      // German basic improvements
      .replace(/\bich\s+sind\b/gi, 'ich bin')
      .replace(/\bdu\s+sind\b/gi, 'du bist')
      .replace(/\ber\s+sind\b/gi, 'er ist')
      // French basic improvements
      .replace(/\bje\s+suis\s+aller\b/gi, 'je suis allé')
      .replace(/\btu\s+es\s+aller\b/gi, 'tu es allé')
      // Spanish basic improvements
      .replace(/\byo\s+son\b/gi, 'yo soy')
      .replace(/\btú\s+son\b/gi, 'tú eres')
      // Capitalization
      .replace(/^[a-z]/, match => match.toUpperCase())
      .replace(/\.\s+[a-z]/g, match => match.toUpperCase())
      // Double spaces
      .replace(/\s{2,}/g, ' ')
      .trim()

    return {
      originalText: text,
      improvedText: basicImprovement || text,
      operation: 'improve',
      fallback: true
    }
  }
}

// Get word alternatives using qwen-flash
export async function getWordAlternatives(word: string, context: string, options: { mode?: string, sourceLang?: string, targetLang?: string } = {}): Promise<AlternativesResult> {
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
      setTimeout(() => reject(new Error('API call timeout after 5 seconds')), 5000)
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

// Rephrase text using qwen-flash
export async function rephraseText(text: string): Promise<RephraseResult> {
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
    'hard': ['difficult', 'challenging', 'tough', 'demanding', 'complex'],
    // Clothing and accessories
    'shoes': ['footwear', 'sneakers', 'boots', 'sandals', 'loafers'],
    'clothes': ['clothing', 'garments', 'attire', 'apparel', 'outfit'],
    'shirt': ['blouse', 'top', 'jersey', 'tee', 'garment'],
    'pants': ['trousers', 'slacks', 'jeans', 'bottoms', 'legwear'],
    // Common verbs
    'go': ['travel', 'move', 'proceed', 'head', 'journey'],
    'come': ['arrive', 'approach', 'reach', 'appear', 'return'],
    'see': ['observe', 'notice', 'view', 'spot', 'witness'],
    'get': ['obtain', 'acquire', 'receive', 'gain', 'fetch'],
    'take': ['grab', 'seize', 'pick', 'collect', 'carry'],
    'give': ['provide', 'offer', 'present', 'deliver', 'grant'],
    // Common nouns
    'house': ['home', 'residence', 'dwelling', 'property', 'abode'],
    'car': ['vehicle', 'automobile', 'auto', 'transport', 'ride'],
    'food': ['meal', 'cuisine', 'dish', 'nourishment', 'sustenance'],
    'book': ['novel', 'volume', 'publication', 'text', 'manuscript'],
    'time': ['period', 'moment', 'duration', 'interval', 'era'],
    'place': ['location', 'spot', 'area', 'site', 'venue']
  }
  
  return alternatives[word.toLowerCase()] || []
}