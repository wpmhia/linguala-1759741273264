import { NextRequest, NextResponse } from 'next/server'

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
    },
    'wat gaan we vanavond eten': {
      'Danish': 'Hvad skal vi spise i aften?',
      'Swedish': 'Vad ska vi äta ikväll?',
      'Norwegian': 'Hva skal vi spise i kveld?',
      'Finnish': 'Mitä syömme tänä iltana?',
      'German': 'Was essen wir heute Abend?',
      'French': 'Que mangeons-nous ce soir?',
      'Spanish': '¿Qué vamos a cenar esta noche?',
      'English': 'What are we going to eat tonight?',
      'Italian': 'Cosa mangiamo stasera?',
      'Portuguese': 'O que vamos comer hoje à noite?',
      'Polish': 'Co będziemy jeść dziś wieczorem?',
      'Russian': 'Что мы будем есть сегодня вечером?'
    },
    'wat eten we': {
      'Danish': 'Hvad spiser vi?',
      'Swedish': 'Vad äter vi?',
      'Norwegian': 'Hva spiser vi?',
      'Finnish': 'Mitä syömme?',
      'German': 'Was essen wir?',
      'French': 'Que mangeons-nous?',
      'Spanish': '¿Qué comemos?',
      'English': 'What are we eating?'
    }
  }
  
  for (const [phrase, translations] of Object.entries(commonPhrases)) {
    if (lowerText.includes(phrase)) {
      return translations[targetLanguage] || null
    }
  }
  
  return null
}

// Language mapping for Qwen API
const LANGUAGE_MAP: Record<string, string> = {
  auto: 'auto',
  en: 'English',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  da: 'Danish',
  nl: 'Dutch',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  pl: 'Polish',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sk: 'Slovak',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  lt: 'Lithuanian',
  el: 'Greek',
  tr: 'Turkish',
  he: 'Hebrew',
  hi: 'Hindi',
  th: 'Thai',
  vi: 'Vietnamese',
  ms: 'Malay',
  id: 'Indonesian',
  tl: 'Filipino',
  uk: 'Ukrainian',
  // Additional European languages
  is: 'Icelandic',
  be: 'Belarusian',
  ga: 'Irish',
  cy: 'Welsh',
  mt: 'Maltese',
  sr: 'Serbian',
  bs: 'Bosnian',
  mk: 'Macedonian',
  sq: 'Albanian',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Translation request body:', body)
    
    const { text, sourceLang, targetLang, domain, glossary } = body

    if (!text || !targetLang) {
      console.log('Missing required fields:', { text: !!text, targetLang: !!targetLang })
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set DASHSCOPE_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Prepare the translation options
    const sourceLanguage = LANGUAGE_MAP[sourceLang] || (sourceLang === 'auto' ? 'auto' : sourceLang)
    const targetLanguage = LANGUAGE_MAP[targetLang] || targetLang

    // Apply glossary preprocessing if provided
    let processedText = text
    if (glossary && Array.isArray(glossary)) {
      glossary.forEach((entry: any) => {
        if (entry.source && entry.target) {
          // Simple case-insensitive replacement
          const regex = new RegExp(`\\b${entry.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
          processedText = processedText.replace(regex, `[GLOSSARY:${entry.target}]`)
        }
      })
    }

    // Add domain context to improve translation quality
    const domainContexts: Record<string, string> = {
      technical: "This is a technical/IT translation. Focus on accurate technical terminology.",
      medical: "This is a medical translation. Use precise medical terminology.",
      legal: "This is a legal translation. Maintain formal legal language and terminology.",
      business: "This is a business translation. Use professional business terminology.",
      academic: "This is an academic translation. Use scholarly and precise language.",
      creative: "This is a creative translation. Maintain the tone and style of the original."
    }

    // Use a more direct translation prompt approach
    try {
      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages: [{
            role: 'user',
            content: `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only provide the translation, no explanations:\n\n"${text}"`
          }],
          temperature: 0.1,
          max_tokens: 1000
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Qwen API error:', response.status, errorData)
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      const translatedText = data.choices?.[0]?.message?.content?.trim()

      if (!translatedText) {
        throw new Error('No translation received from API')
      }

      // Clean up the response (remove quotes if the API added them)
      const cleanedTranslation = translatedText.replace(/^["']|["']$/g, '').trim()
      
      return NextResponse.json({
        translatedText: cleanedTranslation,
        sourceLang,
        targetLang,
      })
      
    } catch (apiError) {
      console.error('Translation API failed, using fallback:', apiError)
      
      // Fallback to a simple dictionary-based translation for common phrases
      const fallbackTranslations = getFallbackTranslation(text, targetLanguage)
      
      return NextResponse.json({
        translatedText: fallbackTranslations || `Translation temporarily unavailable for: "${text}"`,
        sourceLang,
        targetLang,
        fallback: true
      })
    }

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}