import validator from 'validator'
import { parse as parseUrl } from 'url-parse'

export interface URLValidationResult {
  isValid: boolean
  normalizedUrl?: string
  error?: string
  domain?: string
  protocol?: string
}

export function validateAndNormalizeUrl(input: string): URLValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      error: 'URL is required'
    }
  }

  const trimmedInput = input.trim()
  
  if (!trimmedInput) {
    return {
      isValid: false,
      error: 'URL cannot be empty'
    }
  }

  // Try to add protocol if missing
  let urlToValidate = trimmedInput
  if (!trimmedInput.startsWith('http://') && !trimmedInput.startsWith('https://')) {
    urlToValidate = `https://${trimmedInput}`
  }

  // Basic URL validation
  if (!validator.isURL(urlToValidate, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: true,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
  })) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    }
  }

  try {
    const parsed = parseUrl(urlToValidate)
    
    // Additional validation
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return {
        isValid: false,
        error: 'Invalid hostname'
      }
    }

    // Check for localhost/private IPs (security measure)
    const hostname = parsed.hostname.toLowerCase()
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^::1$/,
      /^fc00:/,
      /^fd00:/,
    ]

    const isPrivate = privatePatterns.some(pattern => pattern.test(hostname))
    if (isPrivate && process.env.NODE_ENV === 'production') {
      return {
        isValid: false,
        error: 'Private/local URLs are not allowed'
      }
    }

    // Check for suspicious TLDs (optional security measure)
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf']
    const hasSuspiciousTld = suspiciousTlds.some(tld => hostname.endsWith(tld))
    
    return {
      isValid: true,
      normalizedUrl: urlToValidate,
      domain: parsed.hostname,
      protocol: parsed.protocol,
      ...(hasSuspiciousTld && { 
        warning: 'This domain uses a TLD that may be associated with spam or malicious content' 
      })
    }

  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to parse URL'
    }
  }
}

export function extractDomainFromUrl(url: string): string | null {
  try {
    const validation = validateAndNormalizeUrl(url)
    return validation.domain || null
  } catch {
    return null
  }
}

export function isValidDomain(domain: string): boolean {
  const dummyUrl = `https://${domain}`
  const validation = validateAndNormalizeUrl(dummyUrl)
  return validation.isValid
}