import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const translations = await prisma.translationHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 translations
    })

    return NextResponse.json({ translations })
  } catch (error) {
    console.error('Failed to fetch translations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sourceText, translatedText, sourceLang, targetLang, domain } = await request.json()

    if (!sourceText || !translatedText || !sourceLang || !targetLang) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const translation = await prisma.translationHistory.create({
      data: {
        sourceText,
        translatedText,
        sourceLang,
        targetLang,
        domain: domain || 'general',
        userId: session.user.id,
      },
    })

    return NextResponse.json({ translation })
  } catch (error) {
    console.error('Failed to save translation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}