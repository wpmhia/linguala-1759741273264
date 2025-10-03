import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface TranslationRequest {
  text: string
  sourceLang: string
  targetLang: string
  domain?: string
  glossary?: Array<{ source: string; target: string }>
}

interface TranslationResponse {
  translatedText: string
  sourceLang: string
  targetLang: string
  fallback?: boolean
}

export function useTranslation() {
  const queryClient = useQueryClient()

  return useMutation<TranslationResponse, Error, TranslationRequest>({
    mutationFn: async (request) => {
      const response = await axios.post('/api/translate', request, {
        timeout: 30000, // 30 second timeout for translation
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      // Cache the translation result
      const cacheKey = `${variables.text}-${variables.sourceLang}-${variables.targetLang}`
      queryClient.setQueryData(['translation', cacheKey], data)
    },
    onError: (error) => {
      console.error('Translation failed:', error)
    },
  })
}