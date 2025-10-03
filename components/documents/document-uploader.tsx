"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, FileText, File, CheckCircle, XCircle, 
  Loader2, Download, Trash2, AlertTriangle 
} from 'lucide-react'
import { toast } from 'sonner'

interface DocumentFile {
  file: File
  id: string
  status: 'uploading' | 'uploaded' | 'processing' | 'translated' | 'error'
  progress: number
  error?: string
  uploadResult?: {
    fileId: string
    fileName: string
    fileType: string
    fileSize: number
    wordCount: number
    pageCount: number
  }
  translationResult?: {
    translatedFileId: string
    downloadPath: string
    translatedFileName: string
  }
}

interface DocumentUploaderProps {
  onFileProcessed?: (result: any) => void
  sourceLang: string
  targetLang: string
}

export function DocumentUploader({ onFileProcessed, sourceLang, targetLang }: DocumentUploaderProps) {
  const [files, setFiles] = useState<DocumentFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const maxSize = 10 * 1024 * 1024 // 10MB
  const acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  }

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragActive(false)

    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large. Maximum size is 10MB.`)
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} is not a supported file type. Please upload PDF, DOCX, or TXT files.`)
        } else {
          toast.error(`Error with ${file.name}: ${error.message}`)
        }
      })
    })

    // Process accepted files
    const newFiles: DocumentFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
      status: 'uploading',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Upload each file
    for (const documentFile of newFiles) {
      await uploadFile(documentFile)
    }
  }, [])

  const uploadFile = async (documentFile: DocumentFile) => {
    try {
      updateFileStatus(documentFile.id, { status: 'uploading', progress: 10 })

      const formData = new FormData()
      formData.append('file', documentFile.file)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      updateFileStatus(documentFile.id, { progress: 50 })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      updateFileStatus(documentFile.id, { 
        status: 'uploaded', 
        progress: 100,
        uploadResult: result
      })

      toast.success(`${documentFile.file.name} uploaded successfully`)

      // Auto-translate if languages are selected
      if (sourceLang && targetLang && sourceLang !== targetLang) {
        await translateDocument(documentFile.id, result)
      }

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      updateFileStatus(documentFile.id, { 
        status: 'error', 
        error: errorMessage 
      })
      toast.error(`Failed to upload ${documentFile.file.name}: ${errorMessage}`)
    }
  }

  const translateDocument = async (fileId: string, uploadResult: any) => {
    try {
      updateFileStatus(fileId, { status: 'processing', progress: 0 })

      const response = await fetch('/api/documents/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: uploadResult.fileId,
          sourceLang,
          targetLang,
          fileName: uploadResult.fileName,
          fileType: uploadResult.fileType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Translation failed')
      }

      const result = await response.json()
      updateFileStatus(fileId, { 
        status: 'translated', 
        progress: 100,
        translationResult: result
      })

      toast.success('Document translated successfully!')
      onFileProcessed?.(result)

    } catch (error) {
      console.error('Translation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Translation failed'
      updateFileStatus(fileId, { 
        status: 'error', 
        error: errorMessage 
      })
      toast.error(`Translation failed: ${errorMessage}`)
    }
  }

  const updateFileStatus = (fileId: string, updates: Partial<DocumentFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ))
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const downloadFile = async (file: DocumentFile) => {
    if (!file.translationResult) return

    try {
      const response = await fetch(file.translationResult.downloadPath)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.translationResult.translatedFileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('File downloaded successfully!')
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const retryTranslation = async (file: DocumentFile) => {
    if (!file.uploadResult) return
    await translateDocument(file.id, file.uploadResult)
  }

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: acceptedTypes,
    maxSize,
    multiple: true
  })

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />
    if (ext === 'docx') return <File className="h-5 w-5 text-blue-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'translated':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dropzoneActive || isDragActive
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        {dropzoneActive ? (
          <div>
            <p className="text-lg font-medium text-blue-600">Drop files here</p>
            <p className="text-sm text-blue-500">PDF, DOCX, or TXT files up to 10MB</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag & drop documents here, or click to select
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, DOCX, and TXT files up to 10MB
            </p>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
        )}
      </div>

      {/* Language Warning */}
      {(!sourceLang || !targetLang || sourceLang === targetLang) && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select source and target languages to enable automatic translation after upload.
          </AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Uploaded Documents</h3>
          
          {files.map((file) => (
            <div key={file.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.file.name)}
                  <div>
                    <p className="font-medium text-sm">{file.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                      {file.uploadResult && (
                        <>
                          {' • '}
                          {file.uploadResult.pageCount > 0 && `${file.uploadResult.pageCount} pages • `}
                          {file.uploadResult.wordCount > 0 && `${file.uploadResult.wordCount} words`}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(file.status)}
                  <span className="text-sm capitalize text-gray-600">
                    {file.status === 'processing' ? 'Translating...' : file.status}
                  </span>
                  
                  {file.status === 'translated' && (
                    <Button
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="ml-2"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  
                  {file.status === 'error' && file.uploadResult && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryTranslation(file)}
                      className="ml-2"
                    >
                      Retry
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              {(file.status === 'uploading' || file.status === 'processing') && (
                <Progress value={file.progress} className="mt-2" />
              )}
              
              {/* Error Message */}
              {file.status === 'error' && file.error && (
                <Alert className="mt-2" variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{file.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}