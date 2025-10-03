import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'
import { PDFProcessor, PDFTranslationData } from '@/lib/document-processors/pdf-processor'
import { DocxProcessor, DocxTranslationData } from '@/lib/document-processors/docx-processor'

// Request validation schema
const TranslateDocumentSchema = z.object({
  fileId: z.string(),
  sourceLang: z.string(),
  targetLang: z.string(),
  fileName: z.string().optional(),
  fileType: z.enum(['pdf', 'docx', 'txt'])
})

async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  try {
    // Use your existing translation API
    const response = await fetch('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang
      })
    })

    if (!response.ok) {
      throw new Error('Translation API request failed')
    }

    const data = await response.json()
    return data.translatedText
  } catch (error) {
    console.error('Translation error:', error)
    throw new Error('Failed to translate text')
  }
}

async function translateLongText(text: string, sourceLang: string, targetLang: string): Promise<string> {
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
      const translatedChunk = await translateText(chunks[i], sourceLang, targetLang)
      translatedChunks.push(translatedChunk)
      
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedInput = TranslateDocumentSchema.parse(body)
    const { fileId, sourceLang, targetLang, fileName, fileType } = validatedInput

    // Construct file path
    const uploadDir = path.join(process.cwd(), 'temp', 'uploads')
    const filePath = path.join(uploadDir, `${fileId}.${fileType === 'docx' ? 'docx' : fileType === 'pdf' ? 'pdf' : 'txt'}`)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: 'File not found. Please upload the document again.' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)
    let translatedBuffer: Buffer

    console.log(`Starting translation: ${fileType} file from ${sourceLang} to ${targetLang}`)

    if (fileType === 'pdf') {
      // Process PDF
      const pdfProcessor = new PDFProcessor()
      
      // Extract text
      const extractionResult = await pdfProcessor.extractText(fileBuffer)
      console.log(`Extracted ${extractionResult.text.length} characters from PDF`)

      // Translate text
      const translatedText = await translateLongText(extractionResult.text, sourceLang, targetLang)
      console.log(`Translation completed: ${translatedText.length} characters`)

      // Create translated PDF
      const translationData: PDFTranslationData = {
        originalText: extractionResult.text,
        translatedText,
        sourceLang,
        targetLang,
        metadata: extractionResult.metadata,
        pageCount: extractionResult.pageCount
      }

      translatedBuffer = await pdfProcessor.createTranslatedPDF(translationData)

    } else if (fileType === 'docx') {
      // Process DOCX
      const docxProcessor = new DocxProcessor()
      
      // Extract text
      const extractionResult = await docxProcessor.extractText(fileBuffer)
      console.log(`Extracted ${extractionResult.text.length} characters from DOCX`)

      // Translate text
      const translatedText = await translateLongText(extractionResult.text, sourceLang, targetLang)
      console.log(`Translation completed: ${translatedText.length} characters`)

      // Create translated DOCX
      const translationData: DocxTranslationData = {
        originalText: extractionResult.text,
        translatedText,
        sourceLang,
        targetLang,
        segments: extractionResult.segments,
        metadata: extractionResult.metadata
      }

      translatedBuffer = await docxProcessor.createTranslatedDocx(translationData)

    } else if (fileType === 'txt') {
      // Process plain text
      const originalText = fileBuffer.toString('utf-8')
      console.log(`Processing text file: ${originalText.length} characters`)

      // Translate text
      const translatedText = await translateLongText(originalText, sourceLang, targetLang)
      console.log(`Translation completed: ${translatedText.length} characters`)

      translatedBuffer = Buffer.from(translatedText, 'utf-8')

    } else {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Save translated file
    const translatedFileId = `translated_${fileId}`
    const translatedFileName = `${translatedFileId}.${fileType === 'docx' ? 'docx' : fileType === 'pdf' ? 'pdf' : 'txt'}`
    const translatedFilePath = path.join(uploadDir, translatedFileName)
    
    await fs.writeFile(translatedFilePath, translatedBuffer)

    // Clean up original file
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.warn('Failed to clean up original file:', error)
    }

    return NextResponse.json({
      success: true,
      translatedFileId,
      originalFileName: fileName || 'document',
      translatedFileName: `${fileName || 'document'}_translated.${fileType}`,
      fileSize: translatedBuffer.length,
      downloadPath: `/api/documents/download/${translatedFileId}`
    })

  } catch (error) {
    console.error('Document translation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('File not found')) {
        return NextResponse.json(
          { error: 'Document not found. Please upload again.' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Translation')) {
        return NextResponse.json(
          { error: 'Translation failed. Please try again.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Translation failed. Please try again later.' },
      { status: 500 }
    )
  }
}