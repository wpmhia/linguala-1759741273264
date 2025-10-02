"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ArrowUpDown, Volume2, RotateCcw, Download, Share2, Settings, Zap, ZapOff, Check, Upload, FileText, Book, Search, Plus, Trash2, Edit3 } from "lucide-react"
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

const DOMAINS = [
  { code: "general", name: "General", description: "General purpose translation" },
  { code: "technical", name: "Technical/IT", description: "Software, hardware, programming" },
  { code: "medical", name: "Medical", description: "Healthcare, pharmaceuticals, biology" },
  { code: "legal", name: "Legal", description: "Contracts, laws, regulations" },
  { code: "business", name: "Business", description: "Finance, marketing, corporate" },
  { code: "academic", name: "Academic", description: "Research, education, scientific" },
  { code: "creative", name: "Creative", description: "Literature, marketing copy, creative writing" }
]

interface GlossaryEntry {
  id: string
  source: string
  target: string
  domain: string
  notes?: string
}

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
  const [selectedDomain, setSelectedDomain] = useState("general")
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([])
  const [showGlossary, setShowGlossary] = useState(false)
  const [newGlossaryEntry, setNewGlossaryEntry] = useState({ source: "", target: "", notes: "" })
  const [historySearch, setHistorySearch] = useState("")
  const [showAdvancedHistory, setShowAdvancedHistory] = useState(false)
  const [translationMode, setTranslationMode] = useState<'text' | 'document'>('text')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [documentContent, setDocumentContent] = useState("")
  const [isProcessingDocument, setIsProcessingDocument] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load history and glossary from localStorage on mount and check URL parameters
  useEffect(() => {
    const savedHistory = localStorage.getItem("translation-history")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }

    const savedGlossary = localStorage.getItem("translation-glossary")
    if (savedGlossary) {
      setGlossary(JSON.parse(savedGlossary))
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

  // Save glossary to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("translation-glossary", JSON.stringify(glossary))
  }, [glossary])

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
          text: applyGlossary(text.trim(), from, to),
          sourceLang: from,
          targetLang: to,
          domain: selectedDomain,
          glossary: glossary.filter(entry => entry.domain === selectedDomain || entry.domain === 'general')
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

  const applyGlossary = (text: string, fromLang: string, toLang: string) => {
    let processedText = text
    const relevantEntries = glossary.filter(entry => 
      entry.domain === selectedDomain || entry.domain === 'general'
    )
    
    relevantEntries.forEach(entry => {
      const regex = new RegExp(`\\b${entry.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      processedText = processedText.replace(regex, entry.target)
    })
    
    return processedText
  }

  const addGlossaryEntry = () => {
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
  }

  const removeGlossaryEntry = (id: string) => {
    setGlossary(prev => prev.filter(entry => entry.id !== id))
    toast.success("Glossary entry removed!")
  }

  const filteredHistory = history.filter(item =>
    item.sourceText.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.translatedText.toLowerCase().includes(historySearch.toLowerCase()) ||
    getLanguageName(item.sourceLang).toLowerCase().includes(historySearch.toLowerCase()) ||
    getLanguageName(item.targetLang).toLowerCase().includes(historySearch.toLowerCase())
  )

  const exportHistory = () => {
    const exportData = {
      history: filteredHistory,
      exportDate: new Date().toISOString(),
      totalItems: filteredHistory.length
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translation-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("History exported successfully!")
  }

  const clearHistory = () => {
    setHistory([])
    toast.success("History cleared!")
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a TXT, PDF, or DOCX file")
      return
    }

    setUploadedFile(file)
    setIsProcessingDocument(true)

    try {
      if (file.type === 'text/plain') {
        const content = await file.text()
        setDocumentContent(content)
        setSourceText(content)
      } else {
        // For PDF and DOCX, we'll need to extract text
        // This is a simplified version - in production you'd use proper libraries
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/extract-document', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          setDocumentContent(data.content)
          setSourceText(data.content)
        } else {
          throw new Error('Failed to extract document content')
        }
      }
      
      toast.success("Document uploaded successfully!")
    } catch (error) {
      console.error('Document processing error:', error)
      toast.error("Failed to process document. Please try again.")
    } finally {
      setIsProcessingDocument(false)
    }
  }

  const downloadTranslatedDocument = () => {
    if (!translatedText.trim() || !uploadedFile) {
      toast.error("No translated document to download")
      return
    }

    const content = `Original Document: ${uploadedFile.name}\n\nTranslated Content:\n${translatedText}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translated-${uploadedFile.name.replace(/\.[^/.]+$/, "")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Translated document downloaded!")
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
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                {realTimeEnabled ? <Zap className="h-4 w-4 text-green-600" /> : <ZapOff className="h-4 w-4 text-gray-400" />}
                <span className="text-sm font-medium">Real-time translation</span>
                <Switch 
                  checked={realTimeEnabled} 
                  onCheckedChange={setRealTimeEnabled}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Domain:</span>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map(domain => (
                      <SelectItem key={domain.code} value={domain.code}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Glossary Button */}
              <Dialog open={showGlossary} onOpenChange={setShowGlossary}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <Book className="h-4 w-4" />
                    <span>Glossary</span>
                    <Badge variant="secondary" className="ml-1">{glossary.length}</Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Translation Glossary</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="manage" className="w-full">
                    <TabsList>
                      <TabsTrigger value="manage">Manage Terms</TabsTrigger>
                      <TabsTrigger value="add">Add New Term</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manage" className="space-y-4">
                      <div className="grid gap-4 max-h-96 overflow-y-auto">
                        {glossary.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No glossary entries yet. Add your first term!</p>
                        ) : (
                          glossary.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{entry.source}</span>
                                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                  <span className="text-blue-600">{entry.target}</span>
                                  <Badge variant="outline" className="text-xs">{DOMAINS.find(d => d.code === entry.domain)?.name}</Badge>
                                </div>
                                {entry.notes && <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGlossaryEntry(entry.id)}
                                className="text-red-600 hover:text-red-700"
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
                          />
                        </div>
                        <div>
                          <Label htmlFor="target-term">Target Term</Label>
                          <Input
                            id="target-term"
                            value={newGlossaryEntry.target}
                            onChange={(e) => setNewGlossaryEntry(prev => ({ ...prev, target: e.target.value }))}
                            placeholder="Enter target term"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          value={newGlossaryEntry.notes}
                          onChange={(e) => setNewGlossaryEntry(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add context or usage notes"
                        />
                      </div>
                      <Button onClick={addGlossaryEntry} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Glossary
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              {/* Advanced History Button */}
              <Dialog open={showAdvancedHistory} onOpenChange={setShowAdvancedHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>History</span>
                    <Badge variant="secondary" className="ml-1">{history.length}</Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Translation History</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Search history..."
                        className="flex-1"
                      />
                      <Button onClick={exportHistory} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button onClick={clearHistory} variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {filteredHistory.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          {historySearch ? "No matching translations found." : "No translation history yet."}
                        </p>
                      ) : (
                        filteredHistory.map(item => (
                          <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>{getLanguageName(item.sourceLang)}</span>
                                <ArrowUpDown className="h-3 w-3" />
                                <span>{getLanguageName(item.targetLang)}</span>
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
                            <div className="text-sm">
                              <p className="font-medium">{item.sourceText}</p>
                              <p className="text-blue-600">{item.translatedText}</p>
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

          {/* Translation Mode Selection */}
          <Tabs value={translationMode} onValueChange={(value) => setTranslationMode(value as 'text' | 'document')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center space-x-2">
                <Edit3 className="h-4 w-4" />
                <span>Text Translation</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Document Translation</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-6">
              {/* Text Translation Interface */}
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
            </TabsContent>

            <TabsContent value="document" className="mt-6">
              {/* Document Translation Interface */}
              <div className="space-y-6">
                {!uploadedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Document</h3>
                    <p className="text-gray-600 mb-4">Support for TXT, PDF, and DOCX files</p>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".txt,.pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-600">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {translatedText && (
                          <Button onClick={downloadTranslatedDocument} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Translation
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setUploadedFile(null)
                            setDocumentContent("")
                            setSourceText("")
                            setTranslatedText("")
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isProcessingDocument && (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        Processing document...
                      </div>
                    )}

                    {documentContent && !isProcessingDocument && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Document Content ({getLanguageName(sourceLang)})
                          </label>
                          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm">{documentContent}</pre>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Translation ({getLanguageName(targetLang)})
                          </label>
                          <div className="border rounded-lg p-4 bg-white min-h-96 max-h-96 overflow-y-auto">
                            {isTranslating ? (
                              <div className="flex items-center text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Translating document...
                              </div>
                            ) : translatedText ? (
                              <pre className="whitespace-pre-wrap text-sm">{translatedText}</pre>
                            ) : (
                              <p className="text-gray-500 text-sm">Click translate to see the result</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {documentContent && !realTimeEnabled && (
                      <div className="flex justify-center">
                        <Button 
                          onClick={() => translateText(documentContent, sourceLang, targetLang)}
                          disabled={isTranslating}
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isTranslating ? "Translating..." : "Translate Document"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {isTranslating && (
            <div className="flex items-center justify-center text-blue-600 font-medium">
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