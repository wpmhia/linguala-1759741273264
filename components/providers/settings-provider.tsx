"use client"

import { createContext, useContext, useEffect, useState } from "react"

// Settings interface
interface AppSettings {
  // Appearance
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
  showAnimations: boolean
  
  // Translation defaults
  defaultSourceLang: string
  defaultTargetLang: string
  autoDetectLanguage: boolean
  showConfidenceScore: boolean
  
  // Writing preferences
  defaultWritingStyle: string
  defaultTone: string
  autoCorrectionsOnly: boolean
  
  // Performance
  autoSaveInterval: number // in seconds
  processingTimeout: number // in seconds
  maxHistoryItems: number
  
  // Notifications
  enableSoundNotifications: boolean
  showProcessingToasts: boolean
  showSuccessToasts: boolean
  showErrorToasts: boolean
  
  // Data & Privacy
  saveTranslationHistory: boolean
  dataRetentionDays: number
  analyticsEnabled: boolean
}

const defaultSettings: AppSettings = {
  // Appearance
  fontSize: 'medium',
  compactMode: false,
  showAnimations: true,
  
  // Translation defaults
  defaultSourceLang: 'auto',
  defaultTargetLang: 'en',
  autoDetectLanguage: true,
  showConfidenceScore: false,
  
  // Writing preferences
  defaultWritingStyle: 'simple',
  defaultTone: 'friendly',
  autoCorrectionsOnly: false,
  
  // Performance
  autoSaveInterval: 30,
  processingTimeout: 30,
  maxHistoryItems: 100,
  
  // Notifications
  enableSoundNotifications: false,
  showProcessingToasts: true,
  showSuccessToasts: true,
  showErrorToasts: true,
  
  // Data & Privacy
  saveTranslationHistory: true,
  dataRetentionDays: 30,
  analyticsEnabled: false,
}

type SettingsContextType = {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  resetSettings: () => void
  exportSettings: () => string
  importSettings: (data: string) => boolean
  clearAllData: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'linguala-settings'

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }, [settings])

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem(STORAGE_KEY)
  }

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2)
  }

  const importSettings = (data: string): boolean => {
    try {
      const importedSettings = JSON.parse(data)
      const validatedSettings = { ...defaultSettings, ...importedSettings }
      setSettings(validatedSettings)
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  const clearAllData = () => {
    // Clear settings
    resetSettings()
    
    // Clear other localStorage data (translation history, etc.)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('linguala-')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  const value: SettingsContextType = {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
    clearAllData,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}