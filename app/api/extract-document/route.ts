import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let content = ''
    
    if (file.type === 'text/plain') {
      content = await file.text()
    } else if (file.type === 'application/pdf') {
      // For PDF files - in a real app you'd use a PDF parsing library like pdf-parse
      // For now, we'll return a placeholder message
      content = `[PDF Document: ${file.name}]\n\nNote: PDF text extraction is not fully implemented in this demo. Please copy and paste the text manually or convert to a text file.`
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX files - in a real app you'd use a library like mammoth
      // For now, we'll return a placeholder message
      content = `[DOCX Document: ${file.name}]\n\nNote: DOCX text extraction is not fully implemented in this demo. Please copy and paste the text manually or save as a text file.`
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    return NextResponse.json({ 
      content,
      filename: file.name,
      size: file.size
    })
    
  } catch (error) {
    console.error('Document extraction error:', error)
    return NextResponse.json({ error: 'Failed to extract document content' }, { status: 500 })
  }
}