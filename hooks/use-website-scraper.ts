import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface ScrapeWebsiteRequest {
  url: string
  extractMethod?: 'readability' | 'basic'
  timeout?: number
}

interface ScrapeWebsiteResponse {
  success: boolean
  url: string
  title: string
  content: string
  excerpt: string
  contentLength: number
  extractMethod: string
}

export function useWebsiteScraper() {
  const queryClient = useQueryClient()

  return useMutation<ScrapeWebsiteResponse, Error, ScrapeWebsiteRequest>({
    mutationFn: async (request) => {
      const response = await axios.post('/api/scrape-website', request, {
        timeout: (request.timeout || 10000) + 5000, // Add 5s buffer
      })
      return response.data
    },
    onSuccess: (data) => {
      // Cache the scraped content
      queryClient.setQueryData(['website-content', data.url], data)
    },
    onError: (error) => {
      console.error('Website scraping failed:', error)
    },
  })
}