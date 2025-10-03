"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowUpDown, Copy, Volume2, Star, MoreHorizontal,
  Check, X, Mic, Settings, History, Loader2
} from "lucide-react"
import { toast } from "sonner"
import { LingualaLogo } from "@/components/ui/linguala-logo"
import { useTextProcessing } from "@/hooks/use-translation"

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

// Operation types
const OPERATIONS = [
  { id: 'translate', name: 'Translate', icon: '🌐' },
  { id: 'improve', name: 'Improve Writing', icon: '✍️' },
  { id: 'rephrase', name: 'Rephrase', icon: '🔄' },
  { id: 'summarize', name: 'Summarize', icon: '📝' }
]

export default function LingualaTranslator() {
  // Core processing state
  const [sourceText, setSourceText] = useState("")
  const [resultText, setResultText] = useState("")
  const [operation, setOperation] = useState("translate")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("en")
  
  // UI state
  const [copySuccess, setCopySuccess] = useState(false)
  const [focusedArea, setFocusedArea] = useState<'source' | 'target' | null>(null)

  // React Query hook
  const processing = useTextProcessing()

  // Helper functions
  const getLanguage = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[1]
  }

  const getPlaceholderText = () => {
    switch (operation) {
      case 'translate':
        return 'Enter text to translate'
      case 'improve':
        return 'Enter text to improve'
      case 'rephrase':
        return 'Enter text to rephrase'
      case 'summarize':
        return 'Enter text to summarize'
      default:
        return 'Enter text'
    }
  }

  const handleSourceTextChange = (text: string) => {
    setSourceText(text)
    if (text.trim()) {
      handleProcessing(text)
    } else {
      setResultText("")
    }
  }

  const handleProcessing = (text: string) => {
    if (!text.trim()) return

    const request: any = {
      text,
      operation
    }

    // Only add language fields for translation
    if (operation === 'translate') {
      request.sourceLang = sourceLang
      request.targetLang = targetLang
    }

    processing.mutate(request, {
      onSuccess: (data) => {
        // Handle different operation results
        switch (data.operation) {
          case 'translate':
            setResultText(data.translatedText || '')
            break
          case 'improve':
            setResultText(data.improvedText || '')
            break
          case 'rephrase':
            setResultText(data.rephrasedText || '')
            break
          case 'summarize':
            setResultText(data.summaryText || '')
            break
          default:
            setResultText('')
        }
        
        if (data.fallback) {
          toast.info("Using fallback processing")
        }
      },
      onError: (error) => {
        console.error('Processing error:', error)
        setResultText("Service temporarily unavailable. Please try again later.")
        toast.error("Processing failed")
      }
    })
  }

  const handleOperationChange = (newOperation: string) => {
    setOperation(newOperation)
    setResultText("")
    
    // Re-process if there's source text
    if (sourceText.trim()) {
      handleProcessing(sourceText)
    }
  }

  const swapLanguages = () => {
    if (sourceLang === "auto" || operation !== 'translate') return
    
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceText(resultText)
    setResultText(sourceText)
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
    setResultText("")
  }

  // Auto-process when languages or operation change
  useEffect(() => {
    if (sourceText.trim()) {
      const timeoutId = setTimeout(() => {
        handleProcessing(sourceText)
      }, 300) // Debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [sourceLang, targetLang, operation])

  const isLoading = processing.isPending

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <LingualaLogo size="md" />
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
        {/* Main Processing Interface */}
        <div className="bg-white">
          {/* Operation Selection */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              {OPERATIONS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => handleOperationChange(op.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    operation === op.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{op.icon}</span>
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection Bar - Only show for translation */}
          {operation === 'translate' && (
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
                className="p-2 hover:bg-gray-200 rounded-full"
                disabled={sourceLang === "auto"}
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
          )}

          {/* Processing Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {/* Source Text */}
            <div className="relative">
              <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">
                <Textarea
                  value={sourceText}
                  onChange={(e) => handleSourceTextChange(e.target.value)}
                  onFocus={() => setFocusedArea('source')}
                  onBlur={() => setFocusedArea(null)}
                  placeholder={getPlaceholderText()}
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
                        className="p-2 hover:bg-gray-200 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-200 rounded-full"
                      disabled
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Text */}
            <div className="relative">
              <div className="min-h-[300px] p-6 text-lg" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div 
                    className={`whitespace-pre-wrap ${!resultText ? 'text-gray-400' : 'text-gray-900'}`}
                    onFocus={() => setFocusedArea('target')}
                    onBlur={() => setFocusedArea(null)}
                    tabIndex={0}
                  >
                    {resultText || `${operation === 'translate' ? 'Translation' : operation === 'improve' ? 'Improved text' : operation === 'rephrase' ? 'Rephrased text' : 'Summary'} will appear here`}
                  </div>
                )}
              </div>

              {/* Result Text Controls */}
              {resultText && !isLoading && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resultText)}
                      className="p-2 hover:bg-gray-200 rounded-full"
                    >
                      {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
          <div className="mt-6 flex items-center justify-end">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Powered by Linguala</span>
            </div>
          </div>
        </div>

        {/* Feature showcase */}
        <div className="mt-12">
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                AI-Powered Text Processing Platform
              </h2>
              <p className="text-gray-600 mb-6">
                Advanced AI tools for translation, writing improvement, rephrasing, and summarization. Professional quality results in seconds.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
                <div className="text-center">
                  <div className="font-semibold">25+</div>
                  <div>Languages</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">4</div>
                  <div>AI Tools</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Fast</div>
                  <div>Processing</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Secure</div>
                  <div>& Private</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}