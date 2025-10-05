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
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsModal } from "@/components/settings-modal"
import { useSettings } from "@/components/providers/settings-provider"
import { TextDiff } from "@/components/text-diff"
import { InteractiveText } from "@/components/interactive-text"

// Dynamic imports for code splitting
const TranslatePanel = dynamic(() => import('./translate-panel'), {
  loading: () => (
    <div className="h-20 linguala-glass rounded-2xl linguala-shimmer border border-white/20 dark:border-white/10 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
      </div>
    </div>
  )
})

const WritePanel = dynamic(() => import('./write-panel'), {
  loading: () => (
    <div className="h-20 linguala-glass rounded-2xl linguala-shimmer border border-white/20 dark:border-white/10 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
      </div>
    </div>
  )
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
  setTone,
  showChanges,
  setShowChanges
}: {
  correctionsOnly: boolean
  setCorrectionsOnly: (value: boolean) => void
  writingStyle: string
  setWritingStyle: (value: string) => void
  tone: string
  setTone: (value: string) => void
  showChanges: boolean
  setShowChanges: (value: boolean) => void
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
        ✨ Editing tools
      </div>
      
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="text-sm">Show changes</span>
          </div>
          <Switch 
            checked={showChanges}
            onCheckedChange={setShowChanges}
          />
        </div>
      </div>
      
      <div className="mt-8">
        <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">🎨 Customizations</div>
        <Button variant="outline" className="w-full text-sm bg-white/50 dark:bg-slate-800/50 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all duration-300">
          <Settings className="h-4 w-4 mr-2" />
          Custom rules
          <span className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">Pro</span>
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
  const [showChanges, setShowChanges] = useState(false)
  
  // UI state
  const [focusedArea, setFocusedArea] = useState<'source' | 'target' | null>(null)
  const [justCopied, setJustCopied] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Request management
  const controllerRef = useRef<AbortController>()

  // React Query hook
  const processing = useTextProcessing()



  const getPlaceholderText = () => {
    if (activeTab === 'translate') {
      return 'Enter text to translate.\n\nClick any word in the result for alternatives or to rephrase a sentence.'
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
  }, [sourceLang, targetLang, activeTab, correctionsOnly, writingStyle, tone, handleProcessing])

  const isLoading = processing.isPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      
      {/* Header */}
      <header className="relative z-10 linguala-blur-bg border-b border-white/20 dark:border-white/10">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <LingualaLogo size="md" />
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full transition-all duration-300 hover:scale-110" aria-label="View history">
                <History className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-full transition-all duration-300 hover:scale-110" 
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-screen-xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full linguala-animate-in">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-white/70 dark:bg-slate-800/70 linguala-glass p-1 h-14">
            <TabsTrigger 
              value="translate" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg h-12"
            >
              <Languages className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Translate</span>
                <span className="text-xs opacity-70">35 languages</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="write" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg h-12"
            >
              <FileText className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Write</span>
                <span className="text-xs opacity-70">AI-powered</span>
              </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 linguala-glass rounded-2xl overflow-hidden linguala-rainbow-border shadow-2xl hover:shadow-3xl transition-all duration-500 linguala-card-hover">
            {/* Source Text */}
            <div className="relative group">
              <div className="border-b border-white/20 dark:border-white/10 lg:border-b-0 lg:border-r lg:border-r-white/20 dark:lg:border-r-white/10 bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-800/50 dark:to-slate-900/30">
                <div className={`absolute inset-0 bg-gradient-to-r transition-opacity duration-300 ${
                  focusedArea === 'source' 
                    ? 'from-blue-500/10 to-cyan-500/10 opacity-100' 
                    : 'opacity-0'
                }`} />
                <Textarea
                  value={sourceText}
                  onChange={(e) => handleSourceTextChange(e.target.value)}
                  onFocus={() => setFocusedArea('source')}
                  onBlur={() => setFocusedArea(null)}
                  placeholder={getPlaceholderText()}
                  className="min-h-[400px] text-lg border-0 rounded-none resize-none bg-transparent focus:ring-0 focus-visible:ring-0 p-6 relative z-10 linguala-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{ fontSize: '16px', lineHeight: '1.5' }}
                />
                
                {/* Source Text Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                  <div className="flex items-center space-x-2">
                    {sourceText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearText}
                        className="p-2 hover:bg-red-500/20 dark:hover:bg-red-500/30 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-all duration-300 hover:scale-110 linguala-glass"
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
                      className="p-2 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-all duration-300 hover:scale-110 linguala-glass"
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
                <div className="hidden lg:block absolute top-0 right-0 w-64 h-full linguala-glass border-l border-white/20 dark:border-white/10">
                  <EditingToolsSidebar
                    correctionsOnly={correctionsOnly}
                    setCorrectionsOnly={setCorrectionsOnly}
                    writingStyle={writingStyle}
                    setWritingStyle={setWritingStyle}
                    tone={tone}
                    setTone={setTone}
                    showChanges={showChanges}
                    setShowChanges={setShowChanges}
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
                        showChanges={showChanges}
                        setShowChanges={setShowChanges}
                      />
                    </DrawerContent>
                  </Drawer>
                </div>
              )}
              
              <div className={`min-h-[400px] p-6 text-lg relative ${activeTab === 'write' ? 'lg:mr-64' : ''} bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-800/50 dark:to-slate-900/30`} style={{ fontSize: '16px', lineHeight: '1.5' }}>
                <div className={`absolute inset-0 bg-gradient-to-r transition-opacity duration-300 ${focusedArea === 'target' ? 'from-purple-500/10 to-pink-500/10 opacity-100' : 'opacity-0'}`} />
                {isLoading ? (
                  <div className="flex items-center justify-center h-full relative z-10">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <div className="absolute inset-0 h-8 w-8 border-2 border-purple-500/30 rounded-full animate-ping" />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">Processing your text...</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {activeTab === 'write' && showChanges && sourceText && resultText ? (
                      <div className="space-y-4">
                        <TextDiff 
                          originalText={sourceText}
                          improvedText={resultText}
                        />
                        <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Final result:</h4>
                          <div 
                            className={`min-h-[200px] p-3 rounded-lg ${!resultText ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}
                            style={{ fontSize: '16px', lineHeight: '1.5' }}
                            onFocus={() => setFocusedArea('target')}
                            onBlur={() => setFocusedArea(null)}
                          >
                            {resultText ? (
                              <InteractiveText
                                text={resultText}
                                mode={activeTab as 'translate' | 'write'}
                                sourceLang={sourceLang}
                                targetLang={targetLang}
                                onTextUpdate={setResultText}
                                className="min-h-[180px]"
                              />
                            ) : (
                              <p className="text-slate-400 dark:text-slate-500">✨ Improved text will appear here</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`min-h-[300px] p-3 rounded-lg ${!resultText ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}
                        style={{ fontSize: '16px', lineHeight: '1.5' }}
                        onFocus={() => setFocusedArea('target')}
                        onBlur={() => setFocusedArea(null)}
                      >
                        {resultText ? (
                          <InteractiveText
                            text={resultText}
                            mode={activeTab as 'translate' | 'write'}
                            sourceLang={sourceLang}
                            targetLang={targetLang}
                            onTextUpdate={setResultText}
                            className="min-h-[280px]"
                          />
                        ) : (
                          <p className="text-slate-400 dark:text-slate-500">
                            {activeTab === 'translate' ? '✨ Translation will appear here' : '✨ Improved text will appear here'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Result Text Controls */}
              {resultText && !isLoading && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resultText)}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 linguala-glass ${
                        justCopied 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                          : 'hover:bg-blue-500/20 dark:hover:bg-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      aria-label="Copy to clipboard"
                    >
                      {justCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 hover:text-purple-600 dark:hover:text-purple-400 rounded-full transition-all duration-300 hover:scale-110 linguala-glass"
                      disabled
                      aria-label="Listen to translation (coming soon)"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-yellow-500/20 dark:hover:bg-yellow-500/30 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-full transition-all duration-300 hover:scale-110 linguala-glass"
                      disabled
                      aria-label="Save translation (coming soon)"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-slate-500/20 dark:hover:bg-slate-500/30 hover:text-slate-600 dark:hover:text-slate-400 rounded-full transition-all duration-300 hover:scale-110 linguala-glass"
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

      {/* Settings Modal */}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />

      {/* Footer */}
      <footer className="relative z-10 mt-16 pb-8">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Made with ❤️ in Europe
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}