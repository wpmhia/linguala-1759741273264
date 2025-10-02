"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  ArrowUpDown, Copy, Download, Share2, Settings, Sparkles,
  Zap, ZapOff, Check, BookOpen, History, Upload, FileText,
  Search, Trash2, Plus, Volume2, ChevronRight, Globe,
  TrendingUp, Award, Users, Palette, Brain, Target
} from "lucide-react"
import { toast } from "sonner"
import { LingualaLogo } from "@/components/ui/linguala-logo"
import { UserProfile } from "@/components/user-profile"

// Enhanced language data with regions and popularity
const LANGUAGES = [
  { code: "auto", name: "Detect language", region: "auto", popular: true },
  // Most Popular
  { code: "en", name: "English", region: "Global", popular: true },
  { code: "es", name: "Spanish", region: "Global", popular: true },
  { code: "fr", name: "French", region: "Europe", popular: true },
  { code: "de", name: "German", region: "Europe", popular: true },
  { code: "it", name: "Italian", region: "Europe", popular: true },
  { code: "pt", name: "Portuguese", region: "Global", popular: true },
  { code: "ru", name: "Russian", region: "Europe", popular: true },
  { code: "ja", name: "Japanese", region: "Asia", popular: true },
  { code: "ko", name: "Korean", region: "Asia", popular: true },
  { code: "zh", name: "Chinese", region: "Asia", popular: true },
  { code: "ar", name: "Arabic", region: "Middle East", popular: true },
  { code: "hi", name: "Hindi", region: "Asia", popular: true },
  
  // European Languages
  { code: "da", name: "Danish", region: "Europe", popular: false },
  { code: "sv", name: "Swedish", region: "Europe", popular: false },
  { code: "no", name: "Norwegian", region: "Europe", popular: false },
  { code: "fi", name: "Finnish", region: "Europe", popular: false },
  { code: "nl", name: "Dutch", region: "Europe", popular: false },
  { code: "pl", name: "Polish", region: "Europe", popular: false },
  { code: "cs", name: "Czech", region: "Europe", popular: false },
  { code: "hu", name: "Hungarian", region: "Europe", popular: false },
  { code: "ro", name: "Romanian", region: "Europe", popular: false },
  { code: "bg", name: "Bulgarian", region: "Europe", popular: false },
  { code: "hr", name: "Croatian", region: "Europe", popular: false },
  { code: "sk", name: "Slovak", region: "Europe", popular: false },
  { code: "sl", name: "Slovenian", region: "Europe", popular: false },
  { code: "et", name: "Estonian", region: "Europe", popular: false },
  { code: "lv", name: "Latvian", region: "Europe", popular: false },
  { code: "lt", name: "Lithuanian", region: "Europe", popular: false },
  { code: "el", name: "Greek", region: "Europe", popular: false },
  { code: "tr", name: "Turkish", region: "Europe", popular: false },
  
  // Asian Languages  
  { code: "th", name: "Thai", region: "Asia", popular: false },
  { code: "vi", name: "Vietnamese", region: "Asia", popular: false },
  { code: "ms", name: "Malay", region: "Asia", popular: false },
  { code: "id", name: "Indonesian", region: "Asia", popular: false },
  { code: "tl", name: "Filipino", region: "Asia", popular: false },
]

const DOMAINS = [
  { 
    code: "general", 
    name: "General", 
    description: "Everyday conversations and general content",
    icon: Globe,
    color: "bg-blue-500"
  },
  { 
    code: "technical", 
    name: "Technology", 
    description: "Software, IT, engineering, and technical documentation",
    icon: Brain,
    color: "bg-purple-500"
  },
  { 
    code: "medical", 
    name: "Medical", 
    description: "Healthcare, pharmaceuticals, medical research",
    icon: Award,
    color: "bg-green-500"
  },
  { 
    code: "legal", 
    name: "Legal", 
    description: "Contracts, legal documents, regulatory content",
    icon: Target,
    color: "bg-red-500"
  },
  { 
    code: "business", 
    name: "Business", 
    description: "Finance, marketing, corporate communications",
    icon: TrendingUp,
    color: "bg-orange-500"
  },
  { 
    code: "academic", 
    name: "Academic", 
    description: "Research papers, educational content, scholarly articles",
    icon: Users,
    color: "bg-indigo-500"
  },
  { 
    code: "creative", 
    name: "Creative", 
    description: "Literature, marketing copy, creative writing",
    icon: Palette,
    color: "bg-pink-500"
  }
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

export default function LingualaTranslator() {
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
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [translationMode, setTranslationMode] = useState<'text' | 'document'>('text')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessingDocument, setIsProcessingDocument] = useState(false)

  // Data state
  const [history, setHistory] = useState<TranslationHistory[]>([])
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([])
  const [historySearch, setHistorySearch] = useState("")
  const [newGlossaryEntry, setNewGlossaryEntry] = useState({ source: "", target: "", notes: "" })

  const debounceRef = useRef<NodeJS.Timeout>()

  // Load data from localStorage or database
  useEffect(() => {
    if (session?.user) {
      // Load from database for authenticated users
      loadUserData()
    } else {
      // Load from localStorage for anonymous users
      const savedHistory = localStorage.getItem("linguala-history")
      if (savedHistory) setHistory(JSON.parse(savedHistory))
      
      const savedGlossary = localStorage.getItem("linguala-glossary")
      if (savedGlossary) setGlossary(JSON.parse(savedGlossary))
    }

    // Handle shared URLs
    const urlParams = new URLSearchParams(window.location.search)
    const sharedText = urlParams.get('text')
    const sharedFrom = urlParams.get('from')
    const sharedTo = urlParams.get('to')
    
    if (sharedText && sharedFrom && sharedTo) {
      setSourceText(sharedText)
      setSourceLang(sharedFrom)
      setTargetLang(sharedTo)
      setTimeout(() => translateText(sharedText, sharedFrom, sharedTo), 100)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [session])

  // Save data
  useEffect(() => {
    if (!session?.user) {
      // Save to localStorage for anonymous users
      localStorage.setItem("linguala-history", JSON.stringify(history))
    }
  }, [history, session])

  useEffect(() => {
    if (!session?.user) {
      localStorage.setItem("linguala-glossary", JSON.stringify(glossary))
    }
  }, [glossary, session])

  const loadUserData = async () => {
    try {
      const [historyRes, glossaryRes] = await Promise.all([
        fetch('/api/translations'),
        fetch('/api/glossary')
      ])
      
      if (historyRes.ok) {
        const { translations } = await historyRes.json()
        setHistory(translations.map((t: any) => ({
          id: t.id,
          sourceText: t.sourceText,
          translatedText: t.translatedText,
          sourceLang: t.sourceLang,
          targetLang: t.targetLang,
          domain: t.domain,
          timestamp: new Date(t.createdAt).getTime()
        })))
      }
      
      if (glossaryRes.ok) {
        const { glossaryEntries } = await glossaryRes.json()
        setGlossary(glossaryEntries.map((g: any) => ({
          id: g.id,
          source: g.source,
          target: g.target,
          domain: g.domain,
          notes: g.notes
        })))
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const translateText = async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTranslatedText("")
      return
    }

    setIsTranslating(true)
    setTranslationProgress(0)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setTranslationProgress(prev => Math.min(prev + Math.random() * 30, 90))
    }, 200)

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang: from,
          targetLang: to,
          domain: selectedDomain,
          glossary: glossary.filter(entry => 
            entry.domain === selectedDomain || entry.domain === 'general'
          )
        }),
      })

      if (!response.ok) throw new Error("Translation failed")

      const data = await response.json()
      setTranslatedText(data.translatedText)
      setTranslationProgress(100)

      // Save to history
      const historyItem: TranslationHistory = {
        id: Date.now().toString(),
        sourceText: text.trim(),
        translatedText: data.translatedText,
        sourceLang: from,
        targetLang: to,
        domain: selectedDomain,
        timestamp: Date.now(),
      }
      
      setHistory(prev => [historyItem, ...prev.slice(0, 99)])

      // Save to database if authenticated
      if (session?.user) {
        fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceText: text.trim(),
            translatedText: data.translatedText,
            sourceLang: from,
            targetLang: to,
            domain: selectedDomain
          })
        }).catch(console.error)
      }

    } catch (error) {
      console.error("Translation error:", error)
      toast.error("Translation failed. Please try again.")
    } finally {
      clearInterval(progressInterval)
      setIsTranslating(false)
      setTranslationProgress(0)
    }
  }

  const handleSourceTextChange = (text: string) => {
    setSourceText(text)
    
    if (realTimeEnabled && text.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        translateText(text, sourceLang, targetLang)
      }, 800)
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

  const playAudio = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      speechSynthesis.speak(utterance)
    }
  }

  const addGlossaryEntry = async () => {
    if (!newGlossaryEntry.source.trim() || !newGlossaryEntry.target.trim()) {
      toast.error("Source and target terms are required")
      return
    }

    const entry: GlossaryEntry = {
      id: Date.now().toString(),
      source: newGlossaryEntry.source.trim(),
      target: newGlossaryEntry.target.trim(),
      domain: selectedDomain,
      notes: newGlossaryEntry.notes.trim() || undefined
    }

    setGlossary(prev => [...prev, entry])
    setNewGlossaryEntry({ source: "", target: "", notes: "" })
    toast.success("Glossary entry added!")

    // Save to database if authenticated
    if (session?.user) {
      fetch('/api/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: entry.source,
          target: entry.target,
          domain: entry.domain,
          notes: entry.notes
        })
      }).catch(console.error)
    }
  }

  const removeGlossaryEntry = async (id: string) => {
    setGlossary(prev => prev.filter(entry => entry.id !== id))
    toast.success("Glossary entry removed!")

    if (session?.user) {
      fetch(`/api/glossary?id=${id}`, { method: 'DELETE' }).catch(console.error)
    }
  }

  const getLanguageName = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code)?.name || code
  }

  const getDomainInfo = (code: string) => {
    return DOMAINS.find(domain => domain.code === code) || DOMAINS[0]
  }

  const filteredHistory = history.filter(item =>
    item.sourceText.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.translatedText.toLowerCase().includes(historySearch.toLowerCase()) ||
    getLanguageName(item.sourceLang).toLowerCase().includes(historySearch.toLowerCase()) ||
    getLanguageName(item.targetLang).toLowerCase().includes(historySearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <LingualaLogo size="lg" />
            
            <div className="flex items-center space-x-4">
              {/* Stats for authenticated users */}
              {session?.user && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <History className="h-4 w-4" />
                    <span>{history.length} translations</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{glossary.length} terms</span>
                  </div>
                </div>
              )}
              
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section with Domain Selection */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Professional AI Translation
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Translate with domain expertise, custom glossaries, and enterprise-grade accuracy
          </p>
          
          {/* Domain Quick Selection */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {DOMAINS.map(domain => {
              const IconComponent = domain.icon
              return (
                <Button
                  key={domain.code}
                  variant={selectedDomain === domain.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDomain(domain.code)}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    selectedDomain === domain.code 
                      ? `${domain.color} text-white hover:opacity-90` 
                      : "hover:scale-105"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{domain.name}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Main Translation Interface */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Real-time toggle */}
                <div className="flex items-center space-x-2">
                  {realTimeEnabled ? 
                    <Zap className="h-4 w-4 text-emerald-500" /> : 
                    <ZapOff className="h-4 w-4 text-gray-400" />
                  }
                  <span className="text-sm font-medium">Real-time</span>
                  <Switch 
                    checked={realTimeEnabled} 
                    onCheckedChange={setRealTimeEnabled}
                  />
                </div>

                {/* Current domain */}
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getDomainInfo(selectedDomain).color}`} />
                  <span>{getDomainInfo(selectedDomain).name}</span>
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Dialog open={showGlossary} onOpenChange={setShowGlossary}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Glossary
                      <Badge variant="secondary" className="ml-2">{glossary.length}</Badge>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Custom Glossary</span>
                      </DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="manage" className="w-full">
                      <TabsList>
                        <TabsTrigger value="manage">Manage Terms</TabsTrigger>
                        <TabsTrigger value="add">Add New Term</TabsTrigger>
                      </TabsList>
                      <TabsContent value="manage" className="space-y-4">
                        <div className="grid gap-4 max-h-96 overflow-y-auto">
                          {glossary.length === 0 ? (
                            <div className="text-center py-12">
                              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No glossary entries yet.</p>
                              <p className="text-sm text-gray-400">Add custom terms to improve translation accuracy.</p>
                            </div>
                          ) : (
                            glossary.map(entry => (
                              <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-medium text-gray-900">{entry.source}</span>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                    <span className="text-blue-600 font-medium">{entry.target}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {getDomainInfo(entry.domain).name}
                                    </Badge>
                                  </div>
                                  {entry.notes && (
                                    <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeGlossaryEntry(entry.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="add" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="source-term">Source Term</Label>
                            <Input
                              id="source-term"
                              value={newGlossaryEntry.source}
                              onChange={(e) => setNewGlossaryEntry(prev => ({ ...prev, source: e.target.value }))}
                              placeholder="Enter source term"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="target-term">Target Term</Label>
                            <Input
                              id="target-term"
                              value={newGlossaryEntry.target}
                              onChange={(e) => setNewGlossaryEntry(prev => ({ ...prev, target: e.target.value }))}
                              placeholder="Enter target term"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="notes">Context & Notes</Label>
                          <Input
                            id="notes"
                            value={newGlossaryEntry.notes}
                            onChange={(e) => setNewGlossaryEntry(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add context, usage notes, or examples"
                            className="mt-1"
                          />
                        </div>
                        <Button onClick={addGlossaryEntry} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Glossary
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                <Dialog open={showHistory} onOpenChange={setShowHistory}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      History
                      <Badge variant="secondary" className="ml-2">{history.length}</Badge>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <History className="h-5 w-5" />
                        <span>Translation History</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            placeholder="Search translations..."
                            className="pl-10"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setHistory([])}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </div>
                      
                      <div className="grid gap-3 max-h-96 overflow-y-auto">
                        {filteredHistory.length === 0 ? (
                          <div className="text-center py-12">
                            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                              {historySearch ? "No matching translations found." : "No translation history yet."}
                            </p>
                          </div>
                        ) : (
                          filteredHistory.map(item => (
                            <div key={item.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span className="font-medium">{getLanguageName(item.sourceLang)}</span>
                                  <ChevronRight className="h-3 w-3" />
                                  <span className="font-medium">{getLanguageName(item.targetLang)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getDomainInfo(item.domain).name}
                                  </Badge>
                                  <span>•</span>
                                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(item.translatedText)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-700">{item.sourceText}</p>
                                <p className="text-sm text-blue-600 font-medium">{item.translatedText}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">POPULAR</div>
                    {LANGUAGES.filter(lang => lang.popular).map(lang => (
                      <SelectItem key={lang.code} value={lang.code} className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <span>{lang.name}</span>
                          {lang.region !== "auto" && (
                            <Badge variant="outline" className="text-xs">{lang.region}</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    <Separator className="my-2" />
                    <div className="text-xs font-semibold text-gray-500 mb-2">ALL LANGUAGES</div>
                    {LANGUAGES.filter(lang => !lang.popular).map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center space-x-2">
                          <span>{lang.name}</span>
                          <Badge variant="outline" className="text-xs">{lang.region}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="lg"
                onClick={swapLanguages}
                disabled={sourceLang === "auto"}
                className="p-3 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">POPULAR</div>
                    {LANGUAGES.filter(lang => lang.popular && lang.code !== "auto").map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center space-x-2">
                          <span>{lang.name}</span>
                          <Badge variant="outline" className="text-xs">{lang.region}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                    <Separator className="my-2" />
                    <div className="text-xs font-semibold text-gray-500 mb-2">ALL LANGUAGES</div>
                    {LANGUAGES.filter(lang => !lang.popular && lang.code !== "auto").map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center space-x-2">
                          <span>{lang.name}</span>
                          <Badge variant="outline" className="text-xs">{lang.region}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Translation Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Source Text */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>{getLanguageName(sourceLang)}</span>
                  </Label>
                  {sourceText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(sourceText, sourceLang)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Textarea
                    value={sourceText}
                    onChange={(e) => handleSourceTextChange(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="min-h-[200px] text-base border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {sourceText.length} / 5000
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
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playAudio(translatedText, targetLang)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(translatedText)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          {copySuccess ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Textarea
                    value={translatedText}
                    readOnly
                    placeholder={isTranslating ? "Translating..." : "Translation will appear here"}
                    className="min-h-[200px] text-base bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                  />
                  {isTranslating && translationProgress > 0 && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-white/80 rounded-full p-2">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${translationProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{Math.round(translationProgress)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Manual Translate Button for non-realtime mode */}
            {!realTimeEnabled && sourceText.trim() && (
              <div className="text-center">
                <Button 
                  onClick={() => translateText(sourceText, sourceLang, targetLang)}
                  disabled={isTranslating}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isTranslating ? (
                    <>
                      <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Translate
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shadow-lg">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                if (!translatedText) return toast.error("No translation to export")
                const content = `${sourceText}\n\n→ ${translatedText}`
                const blob = new Blob([content], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'linguala-translation.txt'
                a.click()
                URL.revokeObjectURL(url)
                toast.success("Translation exported!")
              }}>
                Export as TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (!translatedText) return toast.error("No translation to export")
                const data = {
                  source: { text: sourceText, language: sourceLang },
                  target: { text: translatedText, language: targetLang },
                  domain: selectedDomain,
                  timestamp: new Date().toISOString()
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'linguala-translation.json'
                a.click()
                URL.revokeObjectURL(url)
                toast.success("Translation exported!")
              }}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shadow-lg">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={async () => {
                if (!translatedText) return toast.error("No translation to share")
                const params = new URLSearchParams({
                  text: sourceText,
                  from: sourceLang,
                  to: targetLang
                })
                const shareUrl = `https://linguala.eu?${params.toString()}`
                await copyToClipboard(shareUrl)
                toast.success("Share link copied!")
              }}>
                Copy Share Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                if (!translatedText) return toast.error("No translation to share")
                const shareText = `${sourceText} → ${translatedText}\n\nTranslated with Linguala.eu`
                if (navigator.share) {
                  await navigator.share({ title: 'Linguala Translation', text: shareText })
                } else {
                  await copyToClipboard(shareText)
                }
              }}>
                Share Translation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </main>
    </div>
  )
}