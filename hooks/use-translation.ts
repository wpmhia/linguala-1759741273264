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

export function useTextProcessing() {
  const queryClient = useQueryClient()

  return useMutation<ProcessingResponse, Error, ProcessingRequest>({
    mutationFn: async (request) => {
      const response = await axios.post('/api/translate', request, {
        timeout: 30000, // 30 second timeout for processing
      })
      return response.data
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