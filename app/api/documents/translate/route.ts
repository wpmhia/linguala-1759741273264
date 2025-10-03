/**
 * Document Translation API Route
 * 
 * Processes and translates uploaded documents (PDF, DOCX, TXT) using DashScope API.
 * ENVIRONMENT: DASHSCOPE_API_KEY must be set (currently: sk-ad9404d1ced5426082b73e685a95ffa3)
 * Uses chunked translation for large documents to handle API limits.
 */
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'
import { PDFProcessor, PDFTranslationData } from '@/lib/document-processors/pdf-processor'
import { DocxProcessor, DocxTranslationData } from '@/lib/document-processors/docx-processor'
import { translateLongText } from '@/lib/translation-service'

// Request validation schema
const TranslateDocumentSchema = z.object({
  fileId: z.string(),
  sourceLang: z.string(),
  targetLang: z.string(),
  fileName: z.string().optional(),
  fileType: z.enum(['pdf', 'docx', 'txt'])
})

// Translation function is now imported from shared service

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