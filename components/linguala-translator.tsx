"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowUpDown, Copy, Volume2, Star, MoreHorizontal,
  Check, X, Mic, Settings, History, Loader2, Languages, FileText
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

// Writing styles
const WRITING_STYLES = [
  { value: 'simple', label: 'Simple' },
  { value: 'business', label: 'Business' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' }
]

const TONES = [
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'confident', label: 'Confident' },
  { value: 'diplomatic', label: 'Diplomatic' }
]

export default function LingualaTranslator() {
  // Core processing state
  const [sourceText, setSourceText] = useState("")
  const [resultText, setResultText] = useState("")
  const [activeTab, setActiveTab] = useState("translate")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("en")
  
  // Write mode settings
  const [correctionsOnly, setCorrectionsOnly] = useState(false)
  const [writingStyle, setWritingStyle] = useState("simple")
  const [tone, setTone] = useState("friendly")
  
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
    if (activeTab === 'translate') {
      return 'Enter text to translate'
    } else {
      return 'Type or paste text to see ideas for improvement.\n\nClick any word for alternatives or to rephrase a sentence.'
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
    const request: any = {
      text,
      operation: activeTab === 'translate' ? 'translate' : 'improve'
    }

    // Only add language fields for translation
    if (activeTab === 'translate') {
      request.sourceLang = sourceLang
      request.targetLang = targetLang
    } else {
      // Add write mode settings
      request.correctionsOnly = correctionsOnly
      request.writingStyle = writingStyle
      request.tone = tone
    }

    processing.mutate(request, {
      onSuccess: (data) => {
        // Handle different operation results
        if (data.operation === 'translate') {
          setResultText(data.translatedText || '')
        } else if (data.operation === 'improve') {
          setResultText(data.improvedText || '')
        } else {
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



  const swapLanguages = () => {
    if (sourceLang === "auto" || activeTab !== 'translate') return
    
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

  // Auto-process when languages or tab change
  useEffect(() => {
    if (sourceText.trim()) {
      const timeoutId = setTimeout(() => {
        handleProcessing(sourceText)
      }, 300) // Debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [sourceLang, targetLang, activeTab, correctionsOnly, writingStyle, tone])

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
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="translate" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Translate text
              <div className="text-xs text-gray-500">35 languages</div>
            </TabsTrigger>
            <TabsTrigger value="write" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Write
              <div className="text-xs text-gray-500">AI-powered edits</div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="translate" className="space-y-6">
            {/* Language Selection Bar */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="min-w-[160px] border-0 bg-transparent hover:bg-gray-100">
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

              <Button
                variant="ghost"
                size="sm"
                onClick={swapLanguages}
                className="p-2 hover:bg-gray-200 rounded-full"
                disabled={sourceLang === "auto"}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>

              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="min-w-[160px] border-0 bg-transparent hover:bg-gray-100">
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
          </TabsContent>

          <TabsContent value="write" className="space-y-6">
            {/* Write Mode Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="corrections-only" className="text-sm font-medium">Corrections only</Label>
                  <Switch
                    id="corrections-only"
                    checked={correctionsOnly}
                    onCheckedChange={setCorrectionsOnly}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Style</Label>
                    <Select value={writingStyle} onValueChange={setWritingStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WRITING_STYLES.map(style => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map(toneOption => (
                          <SelectItem key={toneOption.value} value={toneOption.value}>
                            {toneOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

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
                  className="min-h-[400px] text-lg border-0 rounded-none resize-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 p-6"
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
              {/* Editing Tools Sidebar */}
              {activeTab === 'write' && (
                <div className="absolute top-0 right-0 w-64 h-full bg-gray-50 border-l border-gray-200 p-4">
                  <div className="text-sm font-medium text-gray-700 mb-4">Editing tools</div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Corrections only</span>
                      </div>
                      <Switch checked={correctionsOnly} onCheckedChange={setCorrectionsOnly} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Styles</span>
                      </div>
                      <Select value={`${writingStyle}-${tone}`} onValueChange={(value) => {
                        const [style, toneValue] = value.split('-')
                        setWritingStyle(style)
                        setTone(toneValue)
                      }}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="None set" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple-friendly">Simple & Friendly</SelectItem>
                          <SelectItem value="business-confident">Business & Confident</SelectItem>
                          <SelectItem value="casual-enthusiastic">Casual & Enthusiastic</SelectItem>
                          <SelectItem value="academic-diplomatic">Academic & Diplomatic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Settings className="h-4 w-4" />
                      <span>Show changes</span>
                      <Switch disabled />
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="text-sm font-medium text-gray-700 mb-2">Customizations</div>
                    <Button variant="outline" className="w-full text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Custom rules
                      <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded">Pro</span>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className={`min-h-[400px] p-6 text-lg ${activeTab === 'write' ? 'mr-64' : ''}`} style={{ fontSize: '16px', lineHeight: '1.5' }}>
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
                    {resultText || (activeTab === 'translate' ? 'Translation will appear here' : 'Improved text will appear here')}
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
        </Tabs>
      </main>
    </div>
  )
}