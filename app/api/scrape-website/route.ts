import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import validator from 'validator'
import { z } from 'zod'

// Input validation schema
const ScrapeRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  extractMethod: z.enum(['readability', 'basic']).default('readability'),
  timeout: z.number().min(1000).max(30000).default(10000)
})

// Rate limiting (simple in-memory store for demo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

async function scrapeWithPuppeteer(url: string, timeout: number): Promise<string> {
  let browser: any = null
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    })
    
    const page = await browser.newPage()
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    await page.setViewport({ width: 1280, height: 720 })
    
    // Navigate with timeout
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout 
    })
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Get the HTML content
    const html = await page.content()
    return html
    
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function extractContentWithReadability(html: string, url: string): { title: string; content: string; excerpt: string } {
  const dom = new JSDOM(html, { url })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()
  
  if (!article) {
    throw new Error('Could not extract readable content from the page')
  }
  
  return {
    title: article.title || 'Untitled',
    content: article.textContent || '',
    excerpt: article.excerpt || ''
  }
}

function extractContentBasic(html: string): { title: string; content: string; excerpt: string } {
  const $ = cheerio.load(html)
  
  // Remove script and style elements
  $('script, style, nav, header, footer, aside').remove()
  
  // Extract title
  const title = $('title').text() || $('h1').first().text() || 'Untitled'
  
  // Extract main content
  let content = ''
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '.main-content',
    '#content',
    '#main'
  ]
  
  for (const selector of contentSelectors) {
    const element = $(selector)
    if (element.length > 0) {
      content = element.text().trim()
      break
    }
  }
  
  // Fallback to body if no main content found
  if (!content) {
    content = $('body').text().trim()
  }
  
  // Clean up content
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
  
  const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content
  
  return { title, content, excerpt }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    
    // Validate input
    const validatedInput = ScrapeRequestSchema.parse(body)
    const { url, extractMethod, timeout } = validatedInput
    
    // Additional URL validation
    if (!validator.isURL(url, { 
      protocols: ['http', 'https'], 
      require_protocol: true 
    })) {
      return NextResponse.json(
        { error: 'Invalid URL. Please provide a valid HTTP or HTTPS URL.' },
        { status: 400 }
      )
    }
    
    console.log(`Scraping website: ${url} using ${extractMethod} method`)
    
    // Scrape the website
    const html = await scrapeWithPuppeteer(url, timeout)
    
    if (!html || html.length < 100) {
      throw new Error('No content found or page too small')
    }
    
    // Extract content using the specified method
    let extractedContent
    
    if (extractMethod === 'readability') {
      extractedContent = extractContentWithReadability(html, url)
    } else {
      extractedContent = extractContentBasic(html)
    }
    
    // Limit content size for translation
    const maxContentLength = 5000
    if (extractedContent.content.length > maxContentLength) {
      extractedContent.content = extractedContent.content.substring(0, maxContentLength) + '...'
    }
    
    return NextResponse.json({
      success: true,
      url,
      title: extractedContent.title,
      content: extractedContent.content,
      excerpt: extractedContent.excerpt,
      contentLength: extractedContent.content.length,
      extractMethod
    })
    
  } catch (error) {
    console.error('Website scraping error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Website took too long to load. Please try again.' },
          { status: 408 }
        )
      }
      
      if (error.message.includes('net::ERR')) {
        return NextResponse.json(
          { error: 'Could not connect to the website. Please check the URL.' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to scrape website. Please try again later.' },
      { status: 500 }
    )
  }
}