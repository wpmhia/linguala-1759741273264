"use client"

import { useState, useCallback } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Loader2, RotateCcw, Lightbulb } from "lucide-react"
import { toast } from "sonner"

interface InteractiveTextProps {
  text: string
  mode: 'translate' | 'write'
  sourceLang?: string
  targetLang?: string
  onTextUpdate: (newText: string) => void
  className?: string
}

interface WordAlternative {
  word: string
  alternatives: string[]
  context: string
}

export function InteractiveText({ 
  text, 
  mode, 
  sourceLang, 
  targetLang, 
  onTextUpdate, 
  className = "" 
}: InteractiveTextProps) {
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    index: number
    sentence: string
  } | null>(null)
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [rephraseOptions, setRephraseOptions] = useState<string[]>([])
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false)
  const [isLoadingRephrase, setIsLoadingRephrase] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Split text into sentences and words
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  
  const getWordAlternatives = useCallback(async (word: string, context: string) => {
    setIsLoadingAlternatives(true)
    try {
      const response = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'alternatives',
          word: word,
          context: context,
          mode: mode,
          sourceLang: sourceLang,
          targetLang: targetLang
        })
      })
      
      const data = await response.json()
      setAlternatives(data.alternatives || [])
    } catch (error) {
      console.error('Error getting word alternatives:', error)
      setAlternatives([])
    } finally {
      setIsLoadingAlternatives(false)
    }
  }, [mode, sourceLang, targetLang])

  const getRephrasedSentence = useCallback(async (sentence: string) => {
    setIsLoadingRephrase(true)
    try {
      const response = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'rephrase',
          text: sentence.trim(),
          mode: mode,
          sourceLang: sourceLang,
          targetLang: targetLang
        })
      })
      
      const data = await response.json()
      setRephraseOptions(data.rephraseOptions || [data.rephrasedText].filter(Boolean))
    } catch (error) {
      console.error('Error rephrasing sentence:', error)
      setRephraseOptions([])
    } finally {
      setIsLoadingRephrase(false)
    }
  }, [mode, sourceLang, targetLang])

  const handleWordClick = useCallback((word: string, wordIndex: number, sentence: string) => {
    // Clean word of punctuation
    const cleanWord = word.replace(/[^\w\s]/g, '').trim()
    if (!cleanWord) return

    setSelectedWord({ word: cleanWord, index: wordIndex, sentence })
    setAlternatives([])
    setRephraseOptions([])
    setPopoverOpen(true)
    
    // Get alternatives and rephrase options
    getWordAlternatives(cleanWord, sentence)
    getRephrasedSentence(sentence)
  }, [getWordAlternatives, getRephrasedSentence])

  const replaceWord = useCallback((newWord: string) => {
    if (!selectedWord) return
    
    const words = text.split(/(\s+)/)
    let wordCount = 0
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].trim()
      if (word && wordCount === selectedWord.index) {
        // Preserve punctuation and capitalization
        const originalWord = words[i]
        const hasCapital = originalWord[0] === originalWord[0].toUpperCase()
        const punctuation = originalWord.match(/[^\w\s]*$/)?.[0] || ''
        
        words[i] = (hasCapital ? newWord[0].toUpperCase() + newWord.slice(1) : newWord) + punctuation
        break
      }
      if (word) wordCount++
    }
    
    const newText = words.join('')
    onTextUpdate(newText)
    setPopoverOpen(false)
    toast.success(`Replaced "${selectedWord.word}" with "${newWord}"`)
  }, [selectedWord, text, onTextUpdate])

  const replaceSentence = useCallback((newSentence: string) => {
    if (!selectedWord) return
    
    const newText = text.replace(selectedWord.sentence, newSentence)
    onTextUpdate(newText)
    setPopoverOpen(false)
    toast.success("Sentence rephrased successfully")
  }, [selectedWord, text, onTextUpdate])

  const renderInteractiveText = () => {
    if (!text.trim()) return null

    let globalWordIndex = 0
    
    return sentences.map((sentence, sentenceIndex) => {
      const words = sentence.split(/(\s+)/)
      
      return (
        <span key={sentenceIndex} className="inline">
          {words.map((part, partIndex) => {
            const word = part.trim()
            if (!word) {
              return <span key={partIndex}>{part}</span>
            }
            
            const currentWordIndex = globalWordIndex++
            const cleanWord = word.replace(/[^\w\s]/g, '')
            
            if (cleanWord.length < 2) {
              return <span key={partIndex}>{part}</span>
            }
            
            return (
              <Popover key={partIndex} open={popoverOpen && selectedWord?.index === currentWordIndex} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => handleWordClick(word, currentWordIndex, sentence)}
                    className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 rounded px-0.5 transition-colors duration-200 cursor-pointer text-left border-none bg-transparent p-0 font-inherit text-inherit"
                    style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                  >
                    {part}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" side="top">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Lightbulb className="h-4 w-4" />
                      Options for "{selectedWord?.word}"
                    </div>
                    
                    {/* Word Alternatives */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Word alternatives:</h4>
                      {isLoadingAlternatives ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Finding alternatives...
                        </div>
                      ) : alternatives.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {alternatives.map((alt, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => replaceWord(alt)}
                              className="text-xs h-7"
                            >
                              {alt}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No alternatives found</p>
                      )}
                    </div>

                    {/* Sentence Rephrase */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <RotateCcw className="h-3 w-3" />
                        Rephrase sentence:
                      </h4>
                      {isLoadingRephrase ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating alternatives...
                        </div>
                      ) : rephraseOptions.length > 0 ? (
                        <div className="space-y-2">
                          {rephraseOptions.map((option, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              onClick={() => replaceSentence(option)}
                              className="w-full text-left justify-start text-xs h-auto p-2 text-wrap whitespace-normal"
                            >
                              "{option}"
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No rephrasing options found</p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )
          })}
        </span>
      )
    })
  }

  return (
    <div className={`leading-relaxed ${className}`} style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
      {renderInteractiveText()}
    </div>
  )
}

// Fallback alternatives for common words
