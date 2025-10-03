import { NextRequest, NextResponse } from 'next/server'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { PDFProcessor } from '@/lib/document-processors/pdf-processor'
import { DocxProcessor } from '@/lib/document-processors/docx-processor'

// Note: Next.js 14 App Router handles multipart form data automatically

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'temp', 'uploads')

async function ensureUploadDir() {
  try {
    await fs.access(uploadDir)
  } catch {
    await fs.mkdir(uploadDir, { recursive: true })
  }
}

async function parseFormData(request: NextRequest): Promise<{ file: File | null }> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return { file: null }
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large')
    }
    
    return { file }
  } catch (error) {
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()

    // Parse the multipart form data
    const { file } = await parseFormData(request)

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    
    // Validate file type
    const fileType = await fileTypeFromBuffer(fileBuffer)
    if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' },
        { status: 400 }
      )
    }

    // Validate file size (already checked in parseFormData, but double-check)
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Process document based on type
    let documentInfo: any = {}
    
    try {
      if (fileType.mime === 'application/pdf') {
        const pdfProcessor = new PDFProcessor()
        documentInfo = await pdfProcessor.getDocumentInfo(fileBuffer)
        documentInfo.type = 'pdf'
      } else if (fileType.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const docxProcessor = new DocxProcessor()
        documentInfo = await docxProcessor.getDocumentInfo(fileBuffer)
        documentInfo.type = 'docx'
      } else if (fileType.mime === 'text/plain') {
        const text = fileBuffer.toString('utf-8')
        documentInfo = {
          wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
          fileSize: fileBuffer.length,
          isValid: true,
          type: 'txt'
        }
      }

      if (!documentInfo.isValid) {
        return NextResponse.json(
          { error: 'Invalid or corrupted document' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Document processing error:', error)
      return NextResponse.json(
        { error: 'Failed to process document' },
        { status: 500 }
      )
    }

    // Generate unique file ID
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const storedFileName = `${fileId}.${fileType.ext}`
    const storedFilePath = path.join(uploadDir, storedFileName)

    // Save file to permanent storage location
    await fs.writeFile(storedFilePath, fileBuffer)

    // Return upload success with document info
    return NextResponse.json({
      success: true,
      fileId,
      fileName: file.name || 'unnamed',
      fileType: documentInfo.type,
      fileSize: documentInfo.fileSize,
      wordCount: documentInfo.wordCount || 0,
      pageCount: documentInfo.pageCount || 0,
      storedPath: storedFilePath
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('maxFileSize')) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}