import mammoth from 'mammoth'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { fileTypeFromBuffer } from 'file-type'

export interface DocxProcessingResult {
  text: string
  html: string
  metadata: {
    wordCount: number
    characterCount: number
  }
  segments: Array<{
    text: string
    type: 'paragraph' | 'heading' | 'list'
    level?: number
  }>
}

export interface DocxTranslationData {
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  segments: DocxProcessingResult['segments']
  metadata: DocxProcessingResult['metadata']
}

export class DocxProcessor {
  async validateDocx(buffer: Buffer): Promise<boolean> {
    try {
      const fileType = await fileTypeFromBuffer(buffer)
      return fileType?.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } catch (error) {
      return false
    }
  }

  async extractText(buffer: Buffer): Promise<DocxProcessingResult> {
    try {
      // Validate DOCX first
      if (!await this.validateDocx(buffer)) {
        throw new Error('Invalid DOCX file')
      }

      // Extract text and HTML using mammoth
      const textResult = await mammoth.extractRawText({ buffer })
      const htmlResult = await mammoth.convertToHtml({ buffer })

      const text = textResult.value
      const html = htmlResult.value

      // Calculate metadata
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
      const characterCount = text.length

      // Parse HTML to extract segments (simplified)
      const segments = this.parseHtmlToSegments(html)

      return {
        text,
        html,
        metadata: {
          wordCount,
          characterCount
        },
        segments
      }
    } catch (error) {
      console.error('DOCX text extraction error:', error)
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseHtmlToSegments(html: string): Array<{ text: string; type: 'paragraph' | 'heading' | 'list'; level?: number }> {
    const segments: Array<{ text: string; type: 'paragraph' | 'heading' | 'list'; level?: number }> = []
    
    // Simple HTML parsing to extract structure
    // This is a basic implementation - in production you'd use a proper HTML parser
    const lines = html.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('<h1>')) {
        const text = trimmed.replace(/<\/?h1>/g, '')
        if (text) segments.push({ text, type: 'heading', level: 1 })
      } else if (trimmed.startsWith('<h2>')) {
        const text = trimmed.replace(/<\/?h2>/g, '')
        if (text) segments.push({ text, type: 'heading', level: 2 })
      } else if (trimmed.startsWith('<h3>')) {
        const text = trimmed.replace(/<\/?h3>/g, '')
        if (text) segments.push({ text, type: 'heading', level: 3 })
      } else if (trimmed.startsWith('<p>')) {
        const text = trimmed.replace(/<\/?p>/g, '').replace(/<[^>]*>/g, '')
        if (text) segments.push({ text, type: 'paragraph' })
      } else if (trimmed.startsWith('<li>')) {
        const text = trimmed.replace(/<\/?li>/g, '').replace(/<[^>]*>/g, '')
        if (text) segments.push({ text, type: 'list' })
      }
    }
    
    // If no segments found, create paragraphs from plain text
    if (segments.length === 0) {
      const paragraphs = html.replace(/<[^>]*>/g, '').split('\n\n').filter(p => p.trim())
      segments.push(...paragraphs.map(text => ({ text: text.trim(), type: 'paragraph' as const })))
    }
    
    return segments
  }

  async createTranslatedDocx(translationData: DocxTranslationData): Promise<Buffer> {
    try {
      // Create paragraphs from translated segments
      const paragraphs: Paragraph[] = []
      
      // Split translated text back into segments
      const translatedSegments = this.splitTranslatedText(
        translationData.translatedText, 
        translationData.segments
      )

      for (let i = 0; i < translatedSegments.length; i++) {
        const segment = translatedSegments[i]
        const originalSegment = translationData.segments[i]
        
        if (!segment.trim()) continue
        
        let paragraph: Paragraph
        
        if (originalSegment?.type === 'heading') {
          // Create heading paragraph
          paragraph = new Paragraph({
            children: [
              new TextRun({
                text: segment,
                bold: true,
                size: originalSegment.level === 1 ? 32 : originalSegment.level === 2 ? 28 : 24,
              }),
            ],
            spacing: { after: 200 },
          })
        } else if (originalSegment?.type === 'list') {
          // Create list item paragraph
          paragraph = new Paragraph({
            children: [
              new TextRun({
                text: `• ${segment}`,
              }),
            ],
            spacing: { after: 100 },
            indent: { left: 720 }, // 0.5 inch indent
          })
        } else {
          // Create regular paragraph
          paragraph = new Paragraph({
            children: [
              new TextRun({
                text: segment,
              }),
            ],
            spacing: { after: 150 },
          })
        }
        
        paragraphs.push(paragraph)
      }

      // If no structured segments, create simple paragraphs
      if (paragraphs.length === 0) {
        const simpleParagraphs = translationData.translatedText
          .split('\n\n')
          .filter(p => p.trim())
          .map(text => new Paragraph({
            children: [new TextRun({ text: text.trim() })],
            spacing: { after: 150 },
          }))
        
        paragraphs.push(...simpleParagraphs)
      }

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      })

      // Generate buffer
      const buffer = await Packer.toBuffer(doc)
      return buffer
      
    } catch (error) {
      console.error('DOCX creation error:', error)
      throw new Error(`Failed to create translated DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private splitTranslatedText(translatedText: string, originalSegments: DocxProcessingResult['segments']): string[] {
    // Simple text splitting based on original segment count
    // In practice, you'd want more sophisticated alignment
    
    if (originalSegments.length === 0) {
      return translatedText.split('\n\n').filter(p => p.trim())
    }
    
    // Split by double newlines first
    const paragraphs = translatedText.split('\n\n').filter(p => p.trim())
    
    if (paragraphs.length >= originalSegments.length) {
      return paragraphs.slice(0, originalSegments.length)
    }
    
    // If we have fewer translated paragraphs than original segments,
    // split the text more aggressively
    const avgCharsPerSegment = Math.ceil(translatedText.length / originalSegments.length)
    const segments: string[] = []
    
    let remaining = translatedText
    for (let i = 0; i < originalSegments.length - 1; i++) {
      if (remaining.length <= avgCharsPerSegment) {
        segments.push(remaining)
        remaining = ''
        break
      }
      
      // Find a good breaking point (sentence or paragraph end)
      let breakPoint = avgCharsPerSegment
      const sentenceEnd = remaining.lastIndexOf('.', breakPoint)
      const paragraphEnd = remaining.lastIndexOf('\n', breakPoint)
      
      if (sentenceEnd > breakPoint * 0.7) {
        breakPoint = sentenceEnd + 1
      } else if (paragraphEnd > breakPoint * 0.7) {
        breakPoint = paragraphEnd + 1
      }
      
      segments.push(remaining.substring(0, breakPoint).trim())
      remaining = remaining.substring(breakPoint).trim()
    }
    
    if (remaining) {
      segments.push(remaining)
    }
    
    return segments
  }

  async getDocumentInfo(buffer: Buffer): Promise<{ wordCount: number; fileSize: number; isValid: boolean }> {
    try {
      const isValid = await this.validateDocx(buffer)
      if (!isValid) {
        return { wordCount: 0, fileSize: buffer.length, isValid: false }
      }

      const result = await mammoth.extractRawText({ buffer })
      const wordCount = result.value.split(/\s+/).filter(word => word.length > 0).length
      
      return {
        wordCount,
        fileSize: buffer.length,
        isValid: true
      }
    } catch (error) {
      return { wordCount: 0, fileSize: buffer.length, isValid: false }
    }
  }
}