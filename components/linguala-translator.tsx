"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { 
  ArrowUpDown, Copy, Volume2, Star, MoreHorizontal,
  Check, X, Mic, Settings, History, Loader2, Languages, FileText
} from "lucide-react"
import { toast } from "sonner"
import { LingualaLogo } from "@/components/ui/linguala-logo"
import { useTextProcessing } from "@/hooks/use-translation"

// Dynamic imports for code splitting
const TranslatePanel = dynamic(() => import('./translate-panel'), {
  loading: () => <div className="h-20 bg-gray-50 rounded-lg animate-pulse" />
})

const WritePanel = dynamic(() => import('./write-panel'), {
  loading: () => <div className="h-20 bg-gray-50 rounded-lg animate-pulse" />
})

// Types for request payload
type TranslateRequest = {
  operation: 'translate'
  text: string
  sourceLang: string
  targetLang: string
}

type ImproveRequest = {
  operation: 'improve'
  text: string
  correctionsOnly: boolean
  writingStyle: string
  tone: string
}

type ProcessingRequest = TranslateRequest | ImproveRequest

// Constants
const MAX_INPUT_LENGTH = 10000 // 10KB limit



// Editing tools sidebar component for reuse
function EditingToolsSidebar({ 
  correctionsOnly, 
  setCorrectionsOnly, 
  writingStyle, 
  setWritingStyle, 
  tone, 
  setTone 
}: {
  correctionsOnly: boolean
  setCorrectionsOnly: (value: boolean) => void
  writingStyle: string
  setWritingStyle: (value: string) => void
  tone: string
  setTone: (value: string) => void
}) {
  return (
    <div className="p-4">
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
  )
}

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
  const [focusedArea, setFocusedArea] = useState<'source' | 'target' | null>(null)
  const [justCopied, setJustCopied] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Request management
  const controllerRef = useRef<AbortController>()

  // React Query hook
  const processing = useTextProcessing()



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

  const handleProcessing = useCallback((text: string) => {
    // Input length validation
    if (text.length > MAX_INPUT_LENGTH) {
      toast.error(`Text too long. Maximum ${MAX_INPUT_LENGTH} characters allowed.`)
      return
    }

    // Cancel previous request
    controllerRef.current?.abort()
    controllerRef.current = new AbortController()

    // Build typed request
    const request: ProcessingRequest = activeTab === 'translate' 
      ? {
          operation: 'translate',
          text,
          sourceLang,
          targetLang
        }
      : {
          operation: 'improve',
          text,
          correctionsOnly,
          writingStyle,
          tone
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
      onError: (error: any) => {
        // Don't show error for aborted requests
        if (error?.name === 'AbortError') return
        
        console.error('Processing error:', error)
        setResultText("Service temporarily unavailable. Please try again later.")
        toast.error("Processing failed")
      }
    })
  }, [activeTab, sourceLang, targetLang, correctionsOnly, writingStyle, tone, processing])



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
      setJustCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setJustCopied(false), 2000)
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
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" aria-label="View history">
                <History className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" aria-label="Settings">
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
            <TranslatePanel
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSourceLangChange={setSourceLang}
              onTargetLangChange={setTargetLang}
              onSwapLanguages={swapLanguages}
            />
          </TabsContent>

          <TabsContent value="write" className="space-y-6">
            <WritePanel
              correctionsOnly={correctionsOnly}
              writingStyle={writingStyle}
              tone={tone}
              onCorrectionsOnlyChange={setCorrectionsOnly}
              onWritingStyleChange={setWritingStyle}
              onToneChange={setTone}
            />
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
                        aria-label="Clear text"
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
                      aria-label="Voice input (coming soon)"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Text */}
            <div className="relative">
              {/* Desktop Editing Tools Sidebar */}
              {activeTab === 'write' && (
                <div className="hidden lg:block absolute top-0 right-0 w-64 h-full bg-gray-50 border-l border-gray-200">
                  <EditingToolsSidebar
                    correctionsOnly={correctionsOnly}
                    setCorrectionsOnly={setCorrectionsOnly}
                    writingStyle={writingStyle}
                    setWritingStyle={setWritingStyle}
                    tone={tone}
                    setTone={setTone}
                  />
                </div>
              )}

              {/* Mobile Editing Tools Drawer */}
              {activeTab === 'write' && (
                <div className="lg:hidden absolute top-4 right-4 z-10">
                  <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" size="sm" aria-label="Edit settings">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <EditingToolsSidebar
                        correctionsOnly={correctionsOnly}
                        setCorrectionsOnly={setCorrectionsOnly}
                        writingStyle={writingStyle}
                        setWritingStyle={setWritingStyle}
                        tone={tone}
                        setTone={setTone}
                      />
                    </DrawerContent>
                  </Drawer>
                </div>
              )}
              
              <div className={`min-h-[400px] p-6 text-lg ${activeTab === 'write' ? 'lg:mr-64' : ''}`} style={{ fontSize: '16px', lineHeight: '1.5' }}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <Textarea
                    value={resultText || ''}
                    placeholder={activeTab === 'translate' ? 'Translation will appear here' : 'Improved text will appear here'}
                    readOnly
                    onFocus={() => setFocusedArea('target')}
                    onBlur={() => setFocusedArea(null)}
                    className={`min-h-[300px] border-0 resize-none bg-transparent focus:ring-0 focus-visible:ring-0 ${!resultText ? 'text-gray-400' : 'text-gray-900'}`}
                    style={{ fontSize: '16px', lineHeight: '1.5' }}
                    aria-label={activeTab === 'translate' ? 'Translation result' : 'Improved text result'}
                  />
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
                      aria-label="Copy to clipboard"
                    >
                      {justCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-200 rounded-full"
                      disabled
                      aria-label="Listen to translation (coming soon)"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-200 rounded-full"
                      disabled
                      aria-label="Save translation (coming soon)"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-200 rounded-full"
                    disabled
                    aria-label="More options (coming soon)"
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