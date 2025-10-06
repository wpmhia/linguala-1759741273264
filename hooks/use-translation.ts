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

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on client errors (400-499) or abort errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error
      }
      if (error.name === 'AbortError') {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Only retry on 5xx errors or network failures
      if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry on other errors
      throw error
    }
  }
  
  throw lastError || new Error('Retry attempts exhausted')
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