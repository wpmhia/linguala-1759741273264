"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

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
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <Select value={sourceLang} onValueChange={onSourceLangChange}>
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
          onClick={onSwapLanguages}
          className="p-2 hover:bg-gray-200 rounded-full transition-transform hover:rotate-180"
          disabled={sourceLang === "auto"}
          aria-label="Swap languages"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>

        <Select value={targetLang} onValueChange={onTargetLangChange}>
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
    </div>
  )
}