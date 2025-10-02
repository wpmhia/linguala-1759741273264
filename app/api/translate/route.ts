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
}

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json()

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

    // Prepare the translation prompt
    const sourceLanguage = LANGUAGE_MAP[sourceLang] || sourceLang
    const targetLanguage = LANGUAGE_MAP[targetLang] || targetLang
    
    let prompt: string
    if (sourceLang === 'auto') {
      prompt = `Translate the following text to ${targetLanguage}. Only return the translation without any additional explanation or formatting:\n\n${text}`
    } else {
      prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translation without any additional explanation or formatting:\n\n${text}`
    }

    // Call Qwen API using OpenAI-compatible interface
    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         model: 'qwen-mt-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Provide accurate translations without any additional commentary, explanations, or formatting. Return only the translated text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
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