import { NextRequest, NextResponse } from 'next/server'

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
}

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang, domain, glossary } = await request.json()

    if (!text || !targetLang) {
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

    // Call Qwen MT API using the correct format for qwen-mt-turbo
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
          content: text
        }],
        translation_options: {
          source_lang: sourceLanguage,
          target_lang: targetLanguage
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Qwen API error:', errorData)
      return NextResponse.json(
        { error: 'Translation service unavailable' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const translatedText = data.choices?.[0]?.message?.content?.trim()

    if (!translatedText) {
      return NextResponse.json(
        { error: 'No translation received' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      translatedText,
      sourceLang,
      targetLang,
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}