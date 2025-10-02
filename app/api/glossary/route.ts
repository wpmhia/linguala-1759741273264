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

    const glossaryEntries = await prisma.glossaryEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ glossaryEntries })
  } catch (error) {
    console.error('Failed to fetch glossary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { source, target, domain, notes } = await request.json()

    if (!source || !target) {
      return NextResponse.json({ error: 'Source and target terms are required' }, { status: 400 })
    }

    const glossaryEntry = await prisma.glossaryEntry.create({
      data: {
        source,
        target,
        domain: domain || 'general',
        notes,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ glossaryEntry })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This glossary entry already exists' }, { status: 409 })
    }
    console.error('Failed to create glossary entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    await prisma.glossaryEntry.delete({
      where: {
        id,
        userId: session.user.id, // Ensure user owns the entry
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete glossary entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}