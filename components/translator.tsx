"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ArrowUpDown, Volume2, RotateCcw, Download, Share2, Settings, Zap, ZapOff, Check } from "lucide-react"
import { toast } from "sonner"

const LANGUAGES = [
  { code: "auto", name: "Detect language" },
  // Northern European languages
  { code: "en", name: "English" },
  { code: "da", name: "Danish" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "de", name: "German" },
  { code: "nl", name: "Dutch" },
  { code: "et", name: "Estonian" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "pl", name: "Polish" },
  { code: "cs", name: "Czech" },
  { code: "sk", name: "Slovak" },
  { code: "uk", name: "Ukrainian" },
  { code: "ru", name: "Russian" },
  // Southern European languages
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "el", name: "Greek" },
  { code: "tr", name: "Turkish" },
  { code: "ro", name: "Romanian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sl", name: "Slovenian" },
  { code: "hu", name: "Hungarian" },
  // Other languages
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "ms", name: "Malay" },
  { code: "id", name: "Indonesian" },
  { code: "tl", name: "Filipino" },
]

interface TranslationHistory {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  timestamp: number
}

export default function Translator() {
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("en")
  const [isTranslating, setIsTranslating] = useState(false)
  const [history, setHistory] = useState<TranslationHistory[]>([])
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load history from localStorage on mount and check URL parameters
  useEffect(() => {
    const savedHistory = localStorage.getItem("translation-history")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }

    // Check for URL parameters for shared translations
    const urlParams = new URLSearchParams(window.location.search)
    const sharedText = urlParams.get('text')
    const sharedFrom = urlParams.get('from')
    const sharedTo = urlParams.get('to')
    
    if (sharedText && sharedFrom && sharedTo) {
      setSourceText(sharedText)
      setSourceLang(sharedFrom)
      setTargetLang(sharedTo)
      // Auto-translate the shared content
      setTimeout(() => {
        translateText(sharedText, sharedFrom, sharedTo)
      }, 100)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("translation-history", JSON.stringify(history))
  }, [history])

  const translateText = async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTranslatedText("")
      return
    }

    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang: from,
          targetLang: to,
        }),
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const data = await response.json()
      setTranslatedText(data.translatedText)

      // Add to history
      const historyItem: TranslationHistory = {
        id: Date.now().toString(),
        sourceText: text.trim(),
        translatedText: data.translatedText,
        sourceLang: from,
        targetLang: to,
        timestamp: Date.now(),
      }
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep only last 10

    } catch (error) {
      console.error("Translation error:", error)
      toast.error("Translation failed. Please try again.")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSourceTextChange = (text: string) => {
    setSourceText(text)
    
    // Only auto-translate if real-time is enabled
    if (realTimeEnabled) {
      // Debounce translation
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      
      debounceRef.current = setTimeout(() => {
        translateText(text, sourceLang, targetLang)
      }, 500)
    }
  }

  const handleLanguageChange = () => {
    if (sourceText.trim()) {
      translateText(sourceText, sourceLang, targetLang)
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
      toast.error("Failed to copy text")
    }
  }

  const downloadTranslation = (format: 'txt' | 'json') => {
    if (!translatedText.trim()) {
      toast.error("No translation to download")
      return
    }

    let content: string
    let mimeType: string
    let filename: string

    if (format === 'txt') {
      content = `Original (${LANGUAGES.find(l => l.code === sourceLang)?.name}):\n${sourceText}\n\nTranslation (${LANGUAGES.find(l => l.code === targetLang)?.name}):\n${translatedText}`
      mimeType = 'text/plain'
      filename = 'translation.txt'
    } else {
      content = JSON.stringify({
        source: {
          text: sourceText,
          language: sourceLang,
          languageName: LANGUAGES.find(l => l.code === sourceLang)?.name
        },
        target: {
          text: translatedText,
          language: targetLang,
          languageName: LANGUAGES.find(l => l.code === targetLang)?.name
        },
        timestamp: new Date().toISOString()
      }, null, 2)
      mimeType = 'application/json'
      filename = 'translation.json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded as ${filename}`)
  }

  const shareTranslation = async (method: 'url' | 'text') => {
    if (!translatedText.trim()) {
      toast.error("No translation to share")
      return
    }

    if (method === 'url') {
      const params = new URLSearchParams({
        text: sourceText,
        from: sourceLang,
        to: targetLang
      })
      const shareUrl = `${window.location.origin}?${params.toString()}`
      
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Share URL copied to clipboard!")
      } catch (error) {
        toast.error("Failed to copy share URL")
      }
    } else {
      const shareText = `${sourceText} → ${translatedText}\n\nTranslated from ${LANGUAGES.find(l => l.code === sourceLang)?.name} to ${LANGUAGES.find(l => l.code === targetLang)?.name}`
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Translation',
            text: shareText
          })
        } catch (error) {
          // Fallback to clipboard
          await copyToClipboard(shareText)
        }
      } else {
        await copyToClipboard(shareText)
      }
    }
  }

  const manualTranslate = () => {
    if (sourceText.trim()) {
      translateText(sourceText, sourceLang, targetLang)
    }
  }

  const clearText = () => {
    setSourceText("")
    setTranslatedText("")
  }

  const getLanguageName = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code)?.name || code
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Translator</h1>
        <p className="text-lg text-gray-600">Fast, accurate translations powered by Qwen MT-Turbo</p>
      </div>

      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Translation Settings */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {realTimeEnabled ? <Zap className="h-4 w-4 text-green-600" /> : <ZapOff className="h-4 w-4 text-gray-400" />}
                <span className="text-sm font-medium">Real-time translation</span>
                <Switch 
                  checked={realTimeEnabled} 
                  onCheckedChange={setRealTimeEnabled}
                />
              </div>
              {!realTimeEnabled && (
                <Button 
                  onClick={manualTranslate}
                  disabled={!sourceText.trim() || isTranslating}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isTranslating ? "Translating..." : "Translate"}
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Copy Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(translatedText)}
                disabled={!translatedText.trim()}
                className="flex items-center space-x-1"
              >
                {copySuccess ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                <span>{copySuccess ? "Copied!" : "Copy"}</span>
              </Button>

              {/* Download Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!translatedText.trim()}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => downloadTranslation('txt')}>
                    Download as Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadTranslation('json')}>
                    Download as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Share Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!translatedText.trim()}
                    className="flex items-center space-x-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => shareTranslation('text')}>
                    Share Translation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareTranslation('url')}>
                    Copy Share URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Language Selection */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
               <Select value={sourceLang} onValueChange={(value) => {
                setSourceLang(value)
                handleLanguageChange()
              }}>
                <SelectTrigger className="w-52 h-12 text-base border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="lg"
                onClick={swapLanguages}
                disabled={sourceLang === "auto"}
                className="p-3 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <ArrowUpDown className="h-5 w-5" />
              </Button>

               <Select value={targetLang} onValueChange={(value) => {
                setTargetLang(value)
                handleLanguageChange()
              }}>
                <SelectTrigger className="w-52 h-12 text-base border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(lang => lang.code !== "auto").map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="lg" onClick={clearText} className="hover:bg-red-50 hover:text-red-600 transition-colors">
              <RotateCcw className="h-5 w-5 mr-2" />
              Clear
            </Button>
          </div>

          {/* Translation Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {getLanguageName(sourceLang)}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(sourceText)}
                  disabled={!sourceText}
                  className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Enter text to translate..."
                value={sourceText}
                onChange={(e) => handleSourceTextChange(e.target.value)}
                className="min-h-[250px] text-base resize-none border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Translated Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {getLanguageName(targetLang)}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(translatedText)}
                  disabled={!translatedText}
                  className="hover:bg-green-50 hover:text-green-600 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder={isTranslating ? "Translating..." : "Translation will appear here..."}
                value={translatedText}
                readOnly
                className="min-h-[250px] text-base resize-none border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50"
              />
            </div>
          </div>

          {/* Translation Status */}
          {isTranslating && (
            <div className="flex items-center justify-center mt-4 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Translating...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation History */}
      {history.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Translations</h2>
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSourceText(item.sourceText)
                    setTranslatedText(item.translatedText)
                    setSourceLang(item.sourceLang)
                    setTargetLang(item.targetLang)
                  }}
                >
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>{getLanguageName(item.sourceLang)} → {getLanguageName(item.targetLang)}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="truncate">{item.sourceText}</div>
                    <div className="truncate font-medium">{item.translatedText}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}