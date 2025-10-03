import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Construct file path - try different extensions
    const uploadDir = path.join(process.cwd(), 'temp', 'uploads')
    const possibleExtensions = ['pdf', 'docx', 'txt']
    
    let filePath: string | null = null
    let fileExtension: string | null = null
    
    for (const ext of possibleExtensions) {
      const testPath = path.join(uploadDir, `${fileId}.${ext}`)
      try {
        await fs.access(testPath)
        filePath = testPath
        fileExtension = ext
        break
      } catch {
        // File doesn't exist with this extension, try next
      }
    }

    if (!filePath || !fileExtension) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)
    
    // Determine content type
    let contentType: string
    let fileExtForHeader: string
    
    switch (fileExtension) {
      case 'pdf':
        contentType = 'application/pdf'
        fileExtForHeader = 'pdf'
        break
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        fileExtForHeader = 'docx'
        break
      case 'txt':
        contentType = 'text/plain'
        fileExtForHeader = 'txt'
        break
      default:
        contentType = 'application/octet-stream'
        fileExtForHeader = 'bin'
    }

    // Create response with file
    const response = new NextResponse(fileBuffer)
    
    // Set headers for file download
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="translated_document.${fileExtForHeader}"`)
    response.headers.set('Content-Length', fileBuffer.length.toString())
    
    // Schedule file cleanup after download (optional)
    // In production, you might want a separate cleanup job
    setTimeout(async () => {
      try {
        await fs.unlink(filePath!)
        console.log(`Cleaned up file: ${filePath}`)
      } catch (error) {
        console.warn(`Failed to cleanup file ${filePath}:`, error)
      }
    }, 5 * 60 * 1000) // Clean up after 5 minutes

    return response

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}