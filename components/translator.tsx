"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ArrowUpDown, Volume2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

const LANGUAGES = [
  { code: "auto", name: "Detect language" },
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
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
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("translation-history")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
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
    
    // Debounce translation
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      translateText(text, sourceLang, targetLang)
    }, 500)
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
      toast.success("Copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy text")
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