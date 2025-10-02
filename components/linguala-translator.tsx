"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { 
  ArrowUpDown, Copy, Download, Share2, Sparkles,
  Check, BookOpen, History, Globe,
  TrendingUp, Brain, Target, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { LingualaLogo } from "@/components/ui/linguala-logo"
import { UserProfile } from "@/components/user-profile"

// Complete European language data
const LANGUAGES = [
  // Auto-detect
  { code: "auto", name: "Detect language", region: "auto", popular: true },
  
  // English - European lingua franca
  { code: "en", name: "English", region: "European Standard", popular: true },
  
  // Major European languages (most popular)
  { code: "de", name: "German", region: "Central Europe", popular: true },
  { code: "fr", name: "French", region: "Western Europe", popular: true },
  { code: "es", name: "Spanish", region: "Southern Europe", popular: true },
  { code: "it", name: "Italian", region: "Southern Europe", popular: true },
  { code: "pt", name: "Portuguese", region: "Southern Europe", popular: true },
  { code: "ru", name: "Russian", region: "Eastern Europe", popular: true },
  { code: "pl", name: "Polish", region: "Eastern Europe", popular: true },
  { code: "nl", name: "Dutch", region: "Western Europe", popular: true },
  
  // Nordic languages (Northern Europe)
  { code: "da", name: "Danish", region: "Nordic Europe", popular: false },
  { code: "sv", name: "Swedish", region: "Nordic Europe", popular: false },
  { code: "no", name: "Norwegian", region: "Nordic Europe", popular: false },
  { code: "fi", name: "Finnish", region: "Nordic Europe", popular: false },
  { code: "is", name: "Icelandic", region: "Nordic Europe", popular: false },
  
  // Other Western European languages
  { code: "be", name: "Belgian", region: "Western Europe", popular: false },
  { code: "ga", name: "Irish", region: "Western Europe", popular: false },
  { code: "cy", name: "Welsh", region: "Western Europe", popular: false },
  { code: "mt", name: "Maltese", region: "Southern Europe", popular: false },
  
  // Central European languages
  { code: "cs", name: "Czech", region: "Central Europe", popular: false },
  { code: "sk", name: "Slovak", region: "Central Europe", popular: false },
  { code: "hu", name: "Hungarian", region: "Central Europe", popular: false },
  { code: "sl", name: "Slovenian", region: "Central Europe", popular: false },
  { code: "hr", name: "Croatian", region: "Central Europe", popular: false },
  
  // Eastern European languages
  { code: "uk", name: "Ukrainian", region: "Eastern Europe", popular: false },
  { code: "bg", name: "Bulgarian", region: "Eastern Europe", popular: false },
  { code: "ro", name: "Romanian", region: "Eastern Europe", popular: false },
  { code: "lt", name: "Lithuanian", region: "Eastern Europe", popular: false },
  { code: "lv", name: "Latvian", region: "Eastern Europe", popular: false },
  { code: "et", name: "Estonian", region: "Eastern Europe", popular: false },
  
  // Balkan languages
  { code: "sr", name: "Serbian", region: "Balkan Europe", popular: false },
  { code: "bs", name: "Bosnian", region: "Balkan Europe", popular: false },
  { code: "mk", name: "Macedonian", region: "Balkan Europe", popular: false },
  { code: "sq", name: "Albanian", region: "Balkan Europe", popular: false },
  { code: "el", name: "Greek", region: "Southern Europe", popular: false }
]

export default function LingualaTranslator() {
  const { data: session, status } = useSession()
  
  // Core translation state
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("en")
  const [isTranslating, setIsTranslating] = useState(false)
  
  // UI state
  const [copySuccess, setCopySuccess] = useState(false)

  // Helper functions
  const getLanguageName = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code)?.name || code
  }

  const handleSourceTextChange = (text: string) => {
    setSourceText(text)
    if (text.trim()) {
      translateText(text, sourceLang, targetLang)
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
      toast.error("Translation temporarily unavailable. Please try again later.")
      // Set a helpful fallback message
      setTranslatedText("Translation service is initializing. Please try again in a moment.")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <LingualaLogo size="lg" />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Translation Interface */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm mb-8">
          <CardHeader className="pb-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">European Translation Platform</h1>
              <p className="text-gray-600">Professional translation tools for European languages</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="flex items-center justify-center space-x-4">
              <Select value={sourceLang} onValueChange={(value) => {
                setSourceLang(value)
                if (sourceText.trim()) translateText(sourceText, value, targetLang)
              }}>
                <SelectTrigger className="w-48 h-12 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
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
                className="p-3 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-110 disabled:opacity-50"
              >
                <ArrowUpDown className="h-5 w-5" />
              </Button>

              <Select value={targetLang} onValueChange={(value) => {
                setTargetLang(value)
                if (sourceText.trim()) translateText(sourceText, sourceLang, value)
              }}>
                <SelectTrigger className="w-48 h-12 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(lang => lang.code !== "auto").map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Translation Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Source Text */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>{getLanguageName(sourceLang)}</span>
                </Label>
                <div className="relative">
                  <Textarea
                    value={sourceText}
                    onChange={(e) => handleSourceTextChange(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="min-h-[200px] text-base border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                  />
                  <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                    <div className={`text-xs ${
                      sourceText.length > 4500 ? 'text-red-500 font-semibold' : 
                      sourceText.length > 4000 ? 'text-orange-500' :
                      'text-gray-400'
                    }`}>
                      {sourceText.length} / 5000
                    </div>
                    {sourceText.length > 4500 && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Translated Text */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>{getLanguageName(targetLang)}</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    {translatedText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(translatedText)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        {copySuccess ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  value={translatedText}
                  readOnly
                  placeholder={isTranslating ? "Translating..." : "Translation will appear here"}
                  className="min-h-[200px] text-base bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features showcase for anonymous users */}
        {!session?.user && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Unlock Professional European Translation
                  </h2>
                  <p className="text-lg text-gray-600">
                    Join thousands of European professionals using advanced translation tools
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Domain Expertise */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-purple-500">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 ml-4">Domain Expertise</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      7 specialized domains: Technology, Medical, Legal, Business, Academic, Creative
                    </p>
                  </div>

                  {/* Custom Glossaries */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-green-500">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 ml-4">Custom Glossaries</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Build personal terminology databases for consistent professional translations
                    </p>
                  </div>

                  {/* Translation History */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-blue-500">
                        <History className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 ml-4">Translation History</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Search and manage all your translations across devices with cloud sync
                    </p>
                  </div>

                  {/* Export & Share */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-orange-500">
                        <Download className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 ml-4">Export & Share</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Download in multiple formats and create shareable translation links
                    </p>
                  </div>

                  {/* Usage Analytics */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-indigo-500">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 ml-4">Usage Analytics</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Track your translation patterns and improve your multilingual workflow
                    </p>
                  </div>

                  {/* European Focus */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-red-500">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 ml-4">European Focus</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Optimized for European languages, culture, and business contexts
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={() => window.location.href = '/auth/signin'}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold"
                  >
                    Join Europe's Translation Platform - Free
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">
                    Sign in to access European domain expertise, multilingual glossaries, and professional tools built for European languages.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}