"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowUpDown, Copy, Volume2, Star, MoreHorizontal,
  Check, X, Mic, Settings, History, FileText
} from "lucide-react"
import { toast } from "sonner"
import { LingualaLogo } from "@/components/ui/linguala-logo"

// Common languages like Google Translate
const LANGUAGES = [
  { code: "auto", name: "Detect language", flag: "🌐" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "no", name: "Norwegian", flag: "🇳🇴" },
  { code: "fi", name: "Finnish", flag: "🇫🇮" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" }
]

export default function LingualaTranslator() {
  // Core translation state
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("en")
  const [isTranslating, setIsTranslating] = useState(false)
  
  // UI state
  const [copySuccess, setCopySuccess] = useState(false)
  const [focusedArea, setFocusedArea] = useState<'source' | 'target' | null>(null)
  const [mode, setMode] = useState<'text' | 'documents' | 'website'>('text')
  const [websiteUrl, setWebsiteUrl] = useState("")

  // Helper functions
  const getLanguage = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[1]
  }

  const handleSourceTextChange = (text: string) => {
    setSourceText(text)
    if (text.trim()) {
      translateText(text, sourceLang, targetLang)
    } else {
      setTranslatedText("")
    }
  }

  const translateText = async (text: string, from: string, to: string) => {
    if (!text.trim()) return
    
    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang: from, targetLang: to })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTranslatedText(data.translatedText)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Translation API error:', errorData)
        throw new Error(errorData.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Translation error:', error)
      setTranslatedText("Translation service temporarily unavailable. Please try again later.")
    } finally {
      setIsTranslating(false)
    }
  }

  const swapLanguages = () => {
    if (sourceLang === "auto") return
    
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const clearText = () => {
    setSourceText("")
    setTranslatedText("")
    setWebsiteUrl("")
  }

  const translateWebsite = async (url: string) => {
    if (!url.trim()) return
    
    // Add https:// if no protocol is specified
    let formattedUrl = url.trim()
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl
    }
    
    setIsTranslating(true)
    setSourceText(`Translating website: ${formattedUrl}`)
    
    try {
      // For demo purposes, we'll extract some common website text
      // In a real implementation, you'd fetch and parse the website content
      const demoContent = `Welcome to our website! We offer professional services and high-quality products. Our team is dedicated to providing excellent customer support. Contact us today to learn more about our offerings.`
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: demoContent, 
          sourceLang: sourceLang, 
          targetLang: targetLang 
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSourceText(demoContent)
        setTranslatedText(data.translatedText)
        toast.success("Website content translated! (Demo mode)")
      } else {
        throw new Error('Translation failed')
      }
    } catch (error) {
      console.error('Website translation error:', error)
      setSourceText("")
      setTranslatedText("Website translation temporarily unavailable. Please try translating text directly.")
      toast.error("Could not translate website")
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Google-style Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <LingualaLogo size="md" />
              <nav className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => setMode('text')}
                  className={`text-sm px-3 py-2 rounded transition-colors ${
                    mode === 'text' 
                      ? 'text-blue-600 bg-blue-50 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Text
                </button>
                <button 
                  onClick={() => {
                    setMode('documents')
                    toast.info("Document translation coming soon!")
                  }}
                  className={`text-sm px-3 py-2 rounded transition-colors ${
                    mode === 'documents' 
                      ? 'text-blue-600 bg-blue-50 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Documents
                </button>
                <button 
                  onClick={() => setMode('website')}
                  className={`text-sm px-3 py-2 rounded transition-colors ${
                    mode === 'website' 
                      ? 'text-blue-600 bg-blue-50 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Website
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <History className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Main Translation Interface */}
        <div className="bg-white">
          {/* Language Selection Bar */}
          <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <Select value={sourceLang} onValueChange={(value) => {
                setSourceLang(value)
                if (sourceText.trim()) translateText(sourceText, value, targetLang)
              }}>
                <SelectTrigger className="min-w-[140px] border-0 bg-transparent hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getLanguage(sourceLang).flag}</span>
                    <span className="font-medium text-sm">{getLanguage(sourceLang).name}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={swapLanguages}
              disabled={sourceLang === "auto"}
              className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-4">
              <Select value={targetLang} onValueChange={(value) => {
                setTargetLang(value)
                if (sourceText.trim()) translateText(sourceText, sourceLang, value)
              }}>
                <SelectTrigger className="min-w-[140px] border-0 bg-transparent hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getLanguage(targetLang).flag}</span>
                    <span className="font-medium text-sm">{getLanguage(targetLang).name}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(lang => lang.code !== "auto").map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Website URL Input (only show in website mode) */}
          {mode === 'website' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-blue-900 whitespace-nowrap">
                  Website URL:
                </label>
                <div className="flex-1 flex space-x-2">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="Enter website URL (e.g., example.com or https://example.com)"
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        translateWebsite(websiteUrl)
                      }
                    }}
                  />
                  <Button
                    onClick={() => translateWebsite(websiteUrl)}
                    disabled={!websiteUrl.trim() || isTranslating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {isTranslating ? "Translating..." : "Translate Site"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 Demo mode: This will translate sample website content. Full website scraping coming soon!
              </p>
            </div>
          )}

          {/* Translation Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {/* Source Text */}
            <div className="relative">
              <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">
                <Textarea
                  value={sourceText}
                  onChange={(e) => handleSourceTextChange(e.target.value)}
                  onFocus={() => setFocusedArea('source')}
                  onBlur={() => setFocusedArea(null)}
                  placeholder={mode === 'website' ? "Website content will appear here..." : "Enter text"}
                  className="min-h-[300px] text-lg border-0 rounded-none resize-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 p-6"
                  style={{ fontSize: '16px', lineHeight: '1.5' }}
                />
                
                {/* Source Text Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {sourceText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearText}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {sourceText.length} / 5000
                  </div>
                </div>
              </div>
            </div>

            {/* Translated Text */}
            <div className="relative bg-gray-50">
              <Textarea
                value={translatedText}
                readOnly
                placeholder={isTranslating ? "Translating..." : "Translation"}
                className="min-h-[300px] text-lg border-0 rounded-none resize-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 p-6 bg-gray-50"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
              />
              
              {/* Translation Controls */}
              {translatedText && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(translatedText)}
                      className="p-2 hover:bg-gray-200 rounded-full"
                    >
                      {copySuccess ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-200 rounded-full"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-200 rounded-full"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {mode === 'text' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMode('documents')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Translate a document
                </Button>
              )}
              {mode === 'website' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMode('text')}
                >
                  Switch to text translation
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Powered by Linguala Translate</span>
            </div>
          </div>
        </div>

        {/* Simple feature showcase */}
        <div className="mt-12">
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Professional Translation Platform
              </h2>
              <p className="text-gray-600 mb-6">
                Fast, accurate translations powered by advanced AI. Support for 25+ languages including all major European languages.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
                <div className="text-center">
                  <div className="font-semibold">25+</div>
                  <div>Languages</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Fast</div>
                  <div>Translation</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Free</div>
                  <div>To Use</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Accurate</div>
                  <div>Results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}