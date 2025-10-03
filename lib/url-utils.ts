import validator from 'validator'

export interface URLValidationResult {
  isValid: boolean
  normalizedUrl?: string
  error?: string
  domain?: string
  protocol?: string
  warning?: string
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

  try {
    // Use built-in URL constructor for validation
    const parsedUrl = new URL(urlToValidate)
    
    // Additional validation
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return {
        isValid: false,
        error: 'Invalid hostname'
      }
    }

    // Check for localhost/private IPs (security measure)
    const hostname = parsedUrl.hostname.toLowerCase()
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
      domain: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      ...(hasSuspiciousTld && { 
        warning: 'This domain uses a TLD that may be associated with spam or malicious content' 
      })
    }

  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
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