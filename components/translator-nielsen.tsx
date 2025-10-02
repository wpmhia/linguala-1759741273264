"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowUpDown, Copy, Download, Share2, Settings, 
  Zap, ZapOff, Check, AlertTriangle, Info, 
  ChevronDown, ChevronUp, BookOpen, History,
  Upload, FileText, Search, Trash2, Plus
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { UserProfile } from "@/components/user-profile"

// Core data structures remain the same
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

const DOMAINS = [
  { code: "general", name: "General", description: "Everyday text and conversations" },
  { code: "technical", name: "Technical", description: "Software, IT, and technical documentation" },
  { code: "medical", name: "Medical", description: "Healthcare and medical terminology" },
  { code: "legal", name: "Legal", description: "Legal documents and terminology" },
  { code: "business", name: "Business", description: "Corporate and financial content" },
  { code: "academic", name: "Academic", description: "Research and educational content" },
  { code: "creative", name: "Creative", description: "Literature and creative writing" }
]

interface TranslationHistory {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  domain: string
  timestamp: number
}

interface GlossaryEntry {
  id: string
  source: string
  target: string
  domain: string
  notes?: string
}

export default function NielsenTranslator() {
  const { data: session, status } = useSession()
  
  // Core translation state
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("en")
  const [selectedDomain, setSelectedDomain] = useState("general")
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [lastAction, setLastAction] = useState<string>("")
  const [errors, setErrors] = useState<string[]>([])

  // Data state
  const [history, setHistory] = useState<TranslationHistory[]>([])
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([])
  const [historySearch, setHistorySearch] = useState("")

  const debounceRef = useRef<NodeJS.Timeout>()

  // Load saved data
  useEffect(() => {
    const savedHistory = localStorage.getItem("translation-history")
    if (savedHistory) setHistory(JSON.parse(savedHistory))

    const savedGlossary = localStorage.getItem("translation-glossary")
    if (savedGlossary) setGlossary(JSON.parse(savedGlossary))

    // Handle shared URLs
    const urlParams = new URLSearchParams(window.location.search)
    const sharedText = urlParams.get('text')
    const sharedFrom = urlParams.get('from')
    const sharedTo = urlParams.get('to')
    
    if (sharedText && sharedFrom && sharedTo) {
      setSourceText(sharedText)
      setSourceLang(sharedFrom)
      setTargetLang(sharedTo)
      setLastAction("Loaded shared translation")
      setTimeout(() => translateText(sharedText, sharedFrom, sharedTo), 100)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Save data changes
  useEffect(() => {
    localStorage.setItem("translation-history", JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem("translation-glossary", JSON.stringify(glossary))
  }, [glossary])

  // Core translation function with Nielsen-style feedback
  const translateText = async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTranslatedText("")
      return
    }

    setErrors([])
    setIsTranslating(true)
    setTranslationProgress(0)
    setLastAction("Starting translation...")

    try {
      // Simulate progress for better user feedback
      const progressInterval = setInterval(() => {
        setTranslationProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang: from,
          targetLang: to,
          domain: selectedDomain,
          glossary: glossary.filter(entry => entry.domain === selectedDomain || entry.domain === 'general')
        }),
      })

      clearInterval(progressInterval)
      setTranslationProgress(100)

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`)
      }

      const data = await response.json()
      setTranslatedText(data.translatedText)
      setLastAction(`Translated from ${getLanguageName(from)} to ${getLanguageName(to)}`)

      // Add to history
      const historyItem: TranslationHistory = {
        id: Date.now().toString(),
        sourceText: text.trim(),
        translatedText: data.translatedText,
        sourceLang: from,
        targetLang: to,
        domain: selectedDomain,
        timestamp: Date.now(),
      }
      setHistory(prev => [historyItem, ...prev.slice(0, 99)]) // Keep last 100

    } catch (error) {
      console.error("Translation error:", error)
      setErrors(["Translation failed. Please check your connection and try again."])
      setLastAction("Translation failed")
      toast.error("Translation failed")
    } finally {
      setIsTranslating(false)
      setTimeout(() => setTranslationProgress(0), 1000)
    }
  }

  // Input handling with debouncing
  const handleSourceTextChange = (text: string) => {
    setSourceText(text)
    setLastAction("Typing...")
    
    if (realTimeEnabled && text.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        translateText(text, sourceLang, targetLang)
      }, 500)
    }
  }

  // Language swapping
  const swapLanguages = () => {
    if (sourceLang === "auto") {
      setErrors(["Cannot swap when auto-detect is selected"])
      return
    }
    
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
    setLastAction("Languages swapped")
  }

  // Utility functions
  const getLanguageName = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code)?.name || code
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setLastAction(`${label} copied to clipboard`)
      toast.success(`${label} copied!`)
    } catch (error) {
      setErrors([`Failed to copy ${label.toLowerCase()}`])
    }
  }

  const clearAll = () => {
    setSourceText("")
    setTranslatedText("")
    setErrors([])
    setLastAction("Text cleared")
  }

  const filteredHistory = history.filter(item =>
    item.sourceText.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.translatedText.toLowerCase().includes(historySearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Clean and purposeful */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Translator</h1>
              <p className="text-sm text-gray-600 mt-1">Fast, accurate translations with specialized terminology</p>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* System Status - Always visible for transparency */}
        <Card className="border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${isTranslating ? 'bg-yellow-500' : errors.length > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className="text-sm text-gray-700">
                  {isTranslating ? "Translating..." : errors.length > 0 ? "Error" : "Ready"}
                </span>
                {lastAction && <span className="text-xs text-gray-500">• {lastAction}</span>}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Auto-translate:</span>
                <Switch 
                  checked={realTimeEnabled} 
                  onCheckedChange={setRealTimeEnabled}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
            
            {isTranslating && (
              <Progress value={translationProgress} className="mt-3 h-1" />
            )}
          </CardContent>
        </Card>

        {/* Error Messages - Nielsen principle of clear error communication */}
        {errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Translation Interface - Primary task focus */}
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Translation</CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map(domain => (
                      <SelectItem key={domain.code} value={domain.code}>
                        <div>
                          <div className="font-medium">{domain.name}</div>
                          <div className="text-xs text-gray-500">{domain.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Language Selection - Clear and consistent */}
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Label htmlFor="source-lang" className="text-xs font-medium text-gray-700 mb-1 block">From</Label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger id="source-lang" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={swapLanguages}
                disabled={sourceLang === "auto"}
                className="mt-5 p-2"
                title="Swap languages"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <Label htmlFor="target-lang" className="text-xs font-medium text-gray-700 mb-1 block">To</Label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger id="target-lang" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(lang => lang.code !== "auto").map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Translation Areas - Side by side for easy comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="source-text" className="text-sm font-medium text-gray-700">
                    {getLanguageName(sourceLang)}
                  </Label>
                  <span className="text-xs text-gray-500">{sourceText.length} characters</span>
                </div>
                <Textarea
                  id="source-text"
                  value={sourceText}
                  onChange={(e) => handleSourceTextChange(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="h-32 resize-none border-gray-300 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    {getLanguageName(targetLang)}
                  </Label>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">{translatedText.length} characters</span>
                    {translatedText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(translatedText, "Translation")}
                        className="h-6 w-6 p-0"
                        title="Copy translation"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Textarea
                    value={translatedText}
                    readOnly
                    placeholder={isTranslating ? "Translating..." : "Translation will appear here"}
                    className="h-32 resize-none bg-gray-50 border-gray-300"
                  />
                  {isTranslating && (
                    <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Translating...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Essential actions only */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                {!realTimeEnabled && (
                  <Button
                    onClick={() => translateText(sourceText, sourceLang, targetLang)}
                    disabled={!sourceText.trim() || isTranslating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Translate
                  </Button>
                )}
                <Button variant="outline" onClick={clearAll} disabled={!sourceText && !translatedText}>
                  Clear
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm"
              >
                Advanced {showAdvanced ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features - Hidden by default to reduce complexity */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Translation History */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center">
                  <History className="h-4 w-4 mr-2" />
                  History ({history.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search history..."
                  className="h-8 text-sm"
                />
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredHistory.slice(0, 10).map(item => (
                    <div key={item.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {getLanguageName(item.sourceLang)} → {getLanguageName(item.targetLang)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.translatedText, "Translation")}
                          className="h-5 w-5 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-gray-700 truncate">{item.sourceText}</div>
                      <div className="text-blue-600 truncate font-medium">{item.translatedText}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(window.location.href + `?text=${encodeURIComponent(sourceText)}&from=${sourceLang}&to=${targetLang}`, "Share link")}
                  disabled={!sourceText.trim()}
                  className="w-full justify-start"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Translation
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const content = `${sourceText}\n\n→ ${translatedText}\n\nFrom: ${getLanguageName(sourceLang)}\nTo: ${getLanguageName(targetLang)}`
                    const blob = new Blob([content], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'translation.txt'
                    a.click()
                    URL.revokeObjectURL(url)
                    setLastAction("Translation downloaded")
                  }}
                  disabled={!translatedText}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Translation
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => {
                    setHistory([])
                    setLastAction("History cleared")
                  }}
                  disabled={history.length === 0}
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Text - Nielsen principle of providing help */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Tips for better translations:</p>
                <ul className="text-xs space-y-1">
                  <li>• Use complete sentences for better context</li>
                  <li>• Select the appropriate domain for specialized terms</li>
                  <li>• Enable auto-translate for real-time results</li>
                  <li>• Check the translation history for previous work</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}