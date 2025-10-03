"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, FileText, Zap, Shield, Clock } from "lucide-react"
import { LingualaLogo } from "@/components/ui/linguala-logo"
import { DocumentUploader } from "@/components/documents/document-uploader"

// Same languages as the main translator
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

export default function DocumentsPage() {
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("en")
  const [processedFiles, setProcessedFiles] = useState<any[]>([])

  const getLanguage = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[1]
  }

  const swapLanguages = () => {
    if (sourceLang === "auto") return
    
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  const handleFileProcessed = (result: any) => {
    setProcessedFiles(prev => [...prev, result])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <LingualaLogo size="md" />
              <nav className="hidden md:flex items-center space-x-6">
                <Button 
                  variant="ghost"
                  onClick={() => window.location.href = '/'}
                  className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded transition-colors"
                >
                  Text
                </Button>
                <div className="text-sm text-blue-600 bg-blue-50 font-medium px-3 py-2 rounded">
                  Documents
                </div>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Document Translation</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload PDF, Word, or text documents and get professional translations while preserving the original formatting and layout.
          </p>
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Translation Settings</h2>
          
          <div className="flex items-center justify-center space-x-6 max-w-2xl mx-auto">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getLanguage(sourceLang).flag}</span>
                    <span>{getLanguage(sourceLang).name}</span>
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
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={swapLanguages}
              disabled={sourceLang === "auto"}
              className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getLanguage(targetLang).flag}</span>
                    <span>{getLanguage(targetLang).name}</span>
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
        </div>

        {/* Document Uploader */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
          <DocumentUploader 
            sourceLang={sourceLang}
            targetLang={targetLang}
            onFileProcessed={handleFileProcessed}
          />
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Format Preservation</h3>
            <p className="text-gray-600 text-sm">
              Maintains original document layout, fonts, and formatting during translation.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fast Processing</h3>
            <p className="text-gray-600 text-sm">
              Advanced AI processing for quick and accurate document translation.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600 text-sm">
              Documents are processed securely and automatically deleted after translation.
            </p>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Supported Document Formats</h3>
          <div className="flex justify-center items-center space-x-8 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-500" />
              <span>PDF Documents</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Word Documents (.docx)</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span>Text Files (.txt)</span>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-4">
            Maximum file size: 10MB per document
          </p>
        </div>

        {/* Processing Status */}
        {processedFiles.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Recently Translated</h3>
            <div className="space-y-3">
              {processedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">{file.originalFileName}</span>
                    <span className="text-sm text-green-600">→ {file.translatedFileName}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => window.open(file.downloadPath, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}