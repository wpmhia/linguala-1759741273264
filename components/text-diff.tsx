"use client"

import { useMemo } from "react"

interface TextDiffProps {
  originalText: string
  improvedText: string
  className?: string
}

interface DiffPart {
  type: 'unchanged' | 'removed' | 'added'
  text: string
}

function generateDiff(original: string, improved: string): DiffPart[] {
  // Simple word-level diff algorithm
  const originalWords = original.split(/(\s+)/)
  const improvedWords = improved.split(/(\s+)/)
  
  const diff: DiffPart[] = []
  let i = 0, j = 0
  
  while (i < originalWords.length || j < improvedWords.length) {
    if (i >= originalWords.length) {
      // Only improved text left
      diff.push({ type: 'added', text: improvedWords[j] })
      j++
    } else if (j >= improvedWords.length) {
      // Only original text left
      diff.push({ type: 'removed', text: originalWords[i] })
      i++
    } else if (originalWords[i] === improvedWords[j]) {
      // Same word
      diff.push({ type: 'unchanged', text: originalWords[i] })
      i++
      j++
    } else {
      // Find next matching word
      let foundMatch = false
      
      // Look ahead in improved text for current original word
      for (let k = j + 1; k < Math.min(j + 5, improvedWords.length); k++) {
        if (originalWords[i] === improvedWords[k]) {
          // Add words from improved that come before the match
          for (let l = j; l < k; l++) {
            diff.push({ type: 'added', text: improvedWords[l] })
          }
          diff.push({ type: 'unchanged', text: originalWords[i] })
          i++
          j = k + 1
          foundMatch = true
          break
        }
      }
      
      if (!foundMatch) {
        // Look ahead in original text for current improved word
        for (let k = i + 1; k < Math.min(i + 5, originalWords.length); k++) {
          if (improvedWords[j] === originalWords[k]) {
            // Add words from original that come before the match
            for (let l = i; l < k; l++) {
              diff.push({ type: 'removed', text: originalWords[l] })
            }
            diff.push({ type: 'unchanged', text: improvedWords[j] })
            i = k + 1
            j++
            foundMatch = true
            break
          }
        }
      }
      
      if (!foundMatch) {
        // No match found, treat as replacement
        diff.push({ type: 'removed', text: originalWords[i] })
        diff.push({ type: 'added', text: improvedWords[j] })
        i++
        j++
      }
    }
  }
  
  return diff
}

export function TextDiff({ originalText, improvedText, className = "" }: TextDiffProps) {
  const diffParts = useMemo(() => {
    return generateDiff(originalText, improvedText)
  }, [originalText, improvedText])
  
  if (originalText === improvedText) {
    return (
      <div className={`p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 ${className}`}>
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium mb-2">
          ✅ No changes needed
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your text looks great! No improvements were suggested.
        </p>
      </div>
    )
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        🔍 Changes made:
      </div>
      
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-sm leading-relaxed">
          {diffParts.map((part, index) => {
            if (part.type === 'unchanged') {
              return (
                <span key={index} className="text-slate-700 dark:text-slate-300">
                  {part.text}
                </span>
              )
            } else if (part.type === 'removed') {
              return (
                <span 
                  key={index} 
                  className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through px-1 rounded"
                  title="Removed"
                >
                  {part.text}
                </span>
              )
            } else {
              return (
                <span 
                  key={index} 
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1 rounded"
                  title="Added"
                >
                  {part.text}
                </span>
              )
            }
          })}
        </div>
        
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></span>
            Added
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></span>
            Removed
          </div>
        </div>
      </div>
    </div>
  )
}