import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { fileTypeFromBuffer } from 'file-type'

export interface PDFProcessingResult {
  text: string
  pageCount: number
  metadata: {
    title?: string
    author?: string
    subject?: string
    creator?: string
  }
  textSegments: Array<{
    text: string
    page: number
    position?: { x: number; y: number }
  }>
}

export interface PDFTranslationData {
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  metadata: PDFProcessingResult['metadata']
  pageCount: number
}

export class PDFProcessor {
  async validatePDF(buffer: Buffer): Promise<boolean> {
    try {
      const fileType = await fileTypeFromBuffer(buffer)
      return fileType?.mime === 'application/pdf'
    } catch (error) {
      return false
    }
  }

  async extractText(buffer: Buffer): Promise<PDFProcessingResult> {
    try {
      // Validate PDF first
      if (!await this.validatePDF(buffer)) {
        throw new Error('Invalid PDF file')
      }

      // Load PDF with pdf-lib for basic extraction
      const pdfDoc = await PDFDocument.load(buffer)
      const pageCount = pdfDoc.getPageCount()
      
      // Get metadata
      const title = pdfDoc.getTitle()
      const author = pdfDoc.getAuthor()
      const subject = pdfDoc.getSubject()
      const creator = pdfDoc.getCreator()

      // For now, we'll use a simplified text extraction
      // In production, you'd want to use a more sophisticated approach
      const extractedText = `[PDF Content - ${pageCount} pages]
This PDF contains ${pageCount} page(s).
Please note: Advanced text extraction from PDF requires additional processing.
For best results, consider converting the PDF to a text file first.`

      const result: PDFProcessingResult = {
        text: extractedText,
        pageCount,
        metadata: {
          title: title || undefined,
          author: author || undefined,
          subject: subject || undefined,
          creator: creator || undefined,
        },
        textSegments: []
      }

      // Create simple text segments (one per page)
      for (let i = 1; i <= pageCount; i++) {
        result.textSegments.push({
          text: `Page ${i} content`,
          page: i
        })
      }

      return result
    } catch (error) {
      console.error('PDF text extraction error:', error)
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async createTranslatedPDF(translationData: PDFTranslationData): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      
      // Set metadata
      pdfDoc.setTitle(translationData.metadata.title ? `${translationData.metadata.title} (Translated)` : 'Translated Document')
      pdfDoc.setAuthor(translationData.metadata.author || 'Linguala Translator')
      pdfDoc.setSubject(translationData.metadata.subject || 'Translated Document')
      pdfDoc.setCreator('Linguala Translation Platform')

      // Embed font (supports more characters than default)
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      
      // Split translated text into pages
      const translatedPages = this.splitTextForPDF(translationData.translatedText, translationData.pageCount)
      
      // Create pages with translated content
      for (const pageText of translatedPages) {
        const page = pdfDoc.addPage()
        const { width, height } = page.getSize()
        
        // Calculate text layout
        const fontSize = 11
        const lineHeight = fontSize * 1.2
        const margin = 50
        const maxWidth = width - (margin * 2)
        
        // Wrap text to fit page width
        const wrappedLines = this.wrapText(pageText, font, fontSize, maxWidth)
        
        // Draw text on page
        let yPosition = height - margin
        for (const line of wrappedLines) {
          if (yPosition < margin) break // Avoid text overflow at bottom
          
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          })
          
          yPosition -= lineHeight
        }
      }

      // Serialize PDF to bytes
      const pdfBytes = await pdfDoc.save()
      return Buffer.from(pdfBytes)
      
    } catch (error) {
      console.error('PDF creation error:', error)
      throw new Error(`Failed to create translated PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private splitTextForPDF(text: string, pageCount: number): string[] {
    // More intelligent text splitting for PDF creation
    const paragraphs = text.split('\n\n').filter(p => p.trim())
    
    if (paragraphs.length <= pageCount) {
      // If we have fewer paragraphs than pages, distribute evenly
      const pages: string[] = []
      const parasPerPage = Math.ceil(paragraphs.length / pageCount)
      
      for (let i = 0; i < pageCount; i++) {
        const start = i * parasPerPage
        const end = Math.min(start + parasPerPage, paragraphs.length)
        pages.push(paragraphs.slice(start, end).join('\n\n'))
      }
      
      return pages.filter(p => p.trim())
    } else {
      // If we have more paragraphs than pages, fill pages to capacity
      const avgCharsPerPage = Math.ceil(text.length / pageCount)
      const pages: string[] = []
      let currentPage = ''
      
      for (const paragraph of paragraphs) {
        if (currentPage.length + paragraph.length > avgCharsPerPage && currentPage.length > 0) {
          pages.push(currentPage.trim())
          currentPage = paragraph
        } else {
          currentPage += (currentPage ? '\n\n' : '') + paragraph
        }
      }
      
      if (currentPage.trim()) {
        pages.push(currentPage.trim())
      }
      
      return pages
    }
  }

  private wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const lines: string[] = []
    const words = text.split(' ')
    let currentLine = ''
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const textWidth = font.widthOfTextAtSize(testLine, fontSize)
      
      if (textWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  async getDocumentInfo(buffer: Buffer): Promise<{ pageCount: number; fileSize: number; isValid: boolean }> {
    try {
      const isValid = await this.validatePDF(buffer)
      if (!isValid) {
        return { pageCount: 0, fileSize: buffer.length, isValid: false }
      }

      const pdfDoc = await PDFDocument.load(buffer)
      return {
        pageCount: pdfDoc.getPageCount(),
        fileSize: buffer.length,
        isValid: true
      }
    } catch (error) {
      return { pageCount: 0, fileSize: buffer.length, isValid: false }
    }
  }
}