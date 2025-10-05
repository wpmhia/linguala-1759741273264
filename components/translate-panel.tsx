"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

// Common languages like Google Translate
const LANGUAGES = [
  { code: "auto", name: "Detect language", flag: "🌐" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fi", name: "Finnish", flag: "🇫🇮" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "no", name: "Norwegian", flag: "🇳🇴" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" }
]

interface TranslatePanelProps {
  sourceLang: string
  targetLang: string
  onSourceLangChange: (lang: string) => void
  onTargetLangChange: (lang: string) => void
  onSwapLanguages: () => void
}

export default function TranslatePanel({
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages
}: TranslatePanelProps) {
  const getLanguage = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[1]
  }

  return (
    <div className="space-y-6">
      {/* Language Selection Bar */}
      <div className="flex items-center justify-between linguala-glass rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <Select value={sourceLang} onValueChange={onSourceLangChange}>
          <SelectTrigger className="min-w-[160px] border-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 rounded-xl transition-all duration-300 hover:scale-105">
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
          onClick={onSwapLanguages}
          className="p-3 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 rounded-full transition-all duration-500 hover:rotate-180 hover:scale-110 linguala-glass"
          disabled={sourceLang === "auto"}
          aria-label="Swap languages"
        >
          <ArrowUpDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </Button>

        <Select value={targetLang} onValueChange={onTargetLangChange}>
          <SelectTrigger className="min-w-[160px] border-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 rounded-xl transition-all duration-300 hover:scale-105">
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
    </div>
  )
}