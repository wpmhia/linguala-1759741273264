import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface ProcessingRequest {
  text: string
  operation?: 'translate' | 'improve' | 'rephrase' | 'summarize'
  sourceLang?: string
  targetLang?: string
  domain?: string
  glossary?: Array<{ source: string; target: string }>
}

interface ProcessingResponse {
  operation: string
  translatedText?: string
  improvedText?: string
  rephrasedText?: string
  summaryText?: string
  originalText?: string
  sourceLang?: string
  targetLang?: string
  fallback?: boolean
}

// Retry helper with exponential backoff and comprehensive error handling
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2, // Reduced retries for faster failure
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  const requestId = Math.random().toString(36).substring(2, 9)
  
  console.log(`[${requestId}] Starting request with ${maxRetries} max retries`)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${requestId}] Attempt ${attempt + 1}/${maxRetries + 1}`)
      const result = await fn()
      console.log(`[${requestId}] Request successful on attempt ${attempt + 1}`)
      return result
    } catch (error: any) {
      lastError = error
      console.log(`[${requestId}] Attempt ${attempt + 1} failed:`, error?.message || error)
      
      // Don't retry on client errors (400-499)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        console.log(`[${requestId}] Client error, not retrying`)
        throw error
      }
      
      // Don't retry on abort/timeout errors - these indicate user cancellation or timeout
      if (error.name === 'AbortError' || 
          error.code === 'ECONNABORTED' || 
          error.message?.includes('timeout') ||
          error.message?.includes('cancelled')) {
        console.log(`[${requestId}] Timeout/abort error, not retrying`)
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        console.log(`[${requestId}] Max retries reached`)
        break
      }
      
      // Only retry on 5xx errors or network failures
      if (error.response?.status >= 500 || 
          error.code === 'NETWORK_ERROR' || 
          error.message?.includes('network') ||
          error.message?.includes('fetch')) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`[${requestId}] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry on other errors
      console.log(`[${requestId}] Error not retryable`)
      throw error
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

export function useTextProcessing() {
  const queryClient = useQueryClient()

  return useMutation<ProcessingResponse, Error, ProcessingRequest>({
    mutationFn: async (request) => {
      return retryWithBackoff(async () => {
        // Route requests to correct API endpoint based on operation
        const endpoint = request.operation === 'translate' ? '/api/translate' : '/api/write'
        
        const response = await axios.post(endpoint, request, {
          timeout: 10000, // 10 second timeout to match backend timeout
        })
        return response.data
      })
    },
    onSuccess: (data, variables) => {
      // Cache the processing result
      const cacheKey = `${variables.operation}-${variables.text}-${variables.sourceLang || ''}-${variables.targetLang || ''}`
      queryClient.setQueryData(['processing', cacheKey], data)
    },
    onError: (error) => {
      console.error('Text processing failed:', error)
    },
  })
}

// Keep the old hook for backward compatibility
export function useTranslation() {
  return useTextProcessing()
}