"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowUpDown, Copy, Volume2, Star, MoreHorizontal,
  Check, X, Mic, Settings, History, FileText, Loader2
} from "lucide-react"
import { toast } from "sonner"
import { LingualaLogo } from "@/components/ui/linguala-logo"
import { useTranslation } from "@/hooks/use-translation"

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
  
  // UI state
  const [copySuccess, setCopySuccess] = useState(false)
  const [focusedArea, setFocusedArea] = useState<'source' | 'target' | null>(null)

  // React Query hook
  const translation = useTranslation()

  // Helper functions
  const getLanguage = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[1]
  }

  const handleSourceTextChange = (text: string) => {
    setSourceText(text)
    if (text.trim()) {
      handleTranslation(text)
    } else {
      setTranslatedText("")
    }
  }

  const handleTranslation = (text: string) => {
    if (!text.trim()) return

    translation.mutate({
      text,
      sourceLang,
      targetLang
    }, {
      onSuccess: (data) => {
        setTranslatedText(data.translatedText)
        if (data.fallback) {
          toast.info("Using fallback translation")
        }
      },
      onError: (error) => {
        console.error('Translation error:', error)
        setTranslatedText("Translation service temporarily unavailable. Please try again later.")
        toast.error("Translation failed")
      }
    })
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
  }

  // Auto-translate when languages change
  useEffect(() => {
    if (sourceText.trim()) {
      const timeoutId = setTimeout(() => {
        handleTranslation(sourceText)
      }, 300) // Debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [sourceLang, targetLang])

  const isLoading = translation.isPending

  return (
    <div className="min-h-screen bg-white">
      {/* Google-style Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <LingualaLogo size="md" />
              <nav className="hidden md:flex items-center space-x-6">
                <div className="text-sm text-blue-600 bg-blue-50 font-medium px-3 py-2 rounded">
                  Text
                </div>
                <button 
                  onClick={() => window.location.href = '/documents'}
                  className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded transition-colors"
                >
                  Documents
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
              <Select value={sourceLang} onValueChange={setSourceLang}>
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
              <Select value={targetLang} onValueChange={setTargetLang}>
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
                  placeholder="Enter text"
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
                      disabled
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
                placeholder={isLoading ? "Translating..." : "Translation"}
                className="min-h-[300px] text-lg border-0 rounded-none resize-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 p-6 bg-gray-50"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
              />
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Translating...</span>
                  </div>
                </div>
              )}
              
              {/* Translation Controls */}
              {translatedText && !isLoading && (
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
                      disabled
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-200 rounded-full"
                      disabled
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-200 rounded-full"
                    disabled
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/documents'}
              >
                <FileText className="h-4 w-4 mr-2" />
                Translate a document
              </Button>
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