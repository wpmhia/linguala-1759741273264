"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  Palette, Languages, FileText, Zap, Bell, Shield, 
  Download, Upload, Trash2, RotateCcw, Check, AlertTriangle 
} from "lucide-react"
import { useSettings } from "@/components/providers/settings-provider"
import { useTheme } from "@/components/providers/theme-provider"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, updateSetting, resetSettings, exportSettings, importSettings, clearAllData } = useSettings()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("appearance")
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false)

  const handleExportSettings = () => {
    const data = exportSettings()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'linguala-settings.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Settings exported successfully!")
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const data = e.target?.result as string
          if (importSettings(data)) {
            toast.success("Settings imported successfully!")
          } else {
            toast.error("Failed to import settings. Please check the file format.")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleResetSettings = () => {
    resetSettings()
    setShowResetConfirm(false)
    toast.success("Settings reset to defaults!")
  }

  const handleClearAllData = () => {
    clearAllData()
    setShowClearDataConfirm(false)
    toast.success("All data cleared successfully!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden linguala-glass">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold linguala-text-gradient flex items-center gap-2">
            ⚙️ Settings
          </DialogTitle>
          <DialogDescription>
            Customize your Linguala experience with these preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 linguala-glass">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="translation" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">Translation</span>
            </TabsTrigger>
            <TabsTrigger value="writing" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Writing</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[500px] overflow-y-auto linguala-scrollbar pr-2">
            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  🎨 Appearance & Theme
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme-select">Color Theme</Label>
                      <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">☀️ Light</SelectItem>
                          <SelectItem value="dark">🌙 Dark</SelectItem>
                          <SelectItem value="system">🖥️ System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="font-size">Font Size</Label>
                      <Select value={settings.fontSize} onValueChange={(value: "small" | "medium" | "large") => updateSetting('fontSize', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="compact-mode">Compact Mode</Label>
                        <p className="text-xs text-muted-foreground">Reduce spacing and padding</p>
                      </div>
                      <Switch
                        id="compact-mode"
                        checked={settings.compactMode}
                        onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="animations">Animations</Label>
                        <p className="text-xs text-muted-foreground">Enable visual transitions</p>
                      </div>
                      <Switch
                        id="animations"
                        checked={settings.showAnimations}
                        onCheckedChange={(checked) => updateSetting('showAnimations', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="translation" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  🌍 Translation Preferences
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Default Source Language</Label>
                      <Select value={settings.defaultSourceLang} onValueChange={(value) => updateSetting('defaultSourceLang', value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🌐 Auto-detect</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷 French</SelectItem>
                          <SelectItem value="de">🇩🇪 German</SelectItem>
                          <SelectItem value="it">🇮🇹 Italian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Default Target Language</Label>
                      <Select value={settings.defaultTargetLang} onValueChange={(value) => updateSetting('defaultTargetLang', value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷 French</SelectItem>
                          <SelectItem value="de">🇩🇪 German</SelectItem>
                          <SelectItem value="it">🇮🇹 Italian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-detect Language</Label>
                        <p className="text-xs text-muted-foreground">Automatically detect source language</p>
                      </div>
                      <Switch
                        checked={settings.autoDetectLanguage}
                        onCheckedChange={(checked) => updateSetting('autoDetectLanguage', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Confidence Score</Label>
                        <p className="text-xs text-muted-foreground">Display translation confidence</p>
                      </div>
                      <Switch
                        checked={settings.showConfidenceScore}
                        onCheckedChange={(checked) => updateSetting('showConfidenceScore', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="writing" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  ✏️ Writing Assistant
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Default Writing Style</Label>
                      <Select value={settings.defaultWritingStyle} onValueChange={(value) => updateSetting('defaultWritingStyle', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Default Tone</Label>
                      <Select value={settings.defaultTone} onValueChange={(value) => updateSetting('defaultTone', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                          <SelectItem value="diplomatic">Diplomatic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Corrections Only</Label>
                        <p className="text-xs text-muted-foreground">Focus on grammar corrections by default</p>
                      </div>
                      <Switch
                        checked={settings.autoCorrectionsOnly}
                        onCheckedChange={(checked) => updateSetting('autoCorrectionsOnly', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  ⚡ Performance & Notifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Auto-save Interval: {settings.autoSaveInterval}s</Label>
                      <Slider
                        value={[settings.autoSaveInterval]}
                        onValueChange={([value]) => updateSetting('autoSaveInterval', value)}
                        max={300}
                        min={10}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Processing Timeout: {settings.processingTimeout}s</Label>
                      <Slider
                        value={[settings.processingTimeout]}
                        onValueChange={([value]) => updateSetting('processingTimeout', value)}
                        max={120}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max History Items: {settings.maxHistoryItems}</Label>
                      <Slider
                        value={[settings.maxHistoryItems]}
                        onValueChange={([value]) => updateSetting('maxHistoryItems', value)}
                        max={1000}
                        min={10}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      🔔 Notifications
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <Label>Sound Notifications</Label>
                      <Switch
                        checked={settings.enableSoundNotifications}
                        onCheckedChange={(checked) => updateSetting('enableSoundNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Processing Toasts</Label>
                      <Switch
                        checked={settings.showProcessingToasts}
                        onCheckedChange={(checked) => updateSetting('showProcessingToasts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Success Toasts</Label>
                      <Switch
                        checked={settings.showSuccessToasts}
                        onCheckedChange={(checked) => updateSetting('showSuccessToasts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Error Toasts</Label>
                      <Switch
                        checked={settings.showErrorToasts}
                        onCheckedChange={(checked) => updateSetting('showErrorToasts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  🔒 Privacy & Data Management
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Save Translation History</Label>
                        <p className="text-xs text-muted-foreground">Store translations locally for quick access</p>
                      </div>
                      <Switch
                        checked={settings.saveTranslationHistory}
                        onCheckedChange={(checked) => updateSetting('saveTranslationHistory', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data Retention: {settings.dataRetentionDays} days</Label>
                      <p className="text-xs text-muted-foreground">Auto-delete old translations</p>
                      <Slider
                        value={[settings.dataRetentionDays]}
                        onValueChange={([value]) => updateSetting('dataRetentionDays', value)}
                        max={365}
                        min={1}
                        step={7}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Anonymous Analytics</Label>
                        <p className="text-xs text-muted-foreground">Help improve Linguala (no personal data)</p>
                      </div>
                      <Switch
                        checked={settings.analyticsEnabled}
                        onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      💾 Data Management
                    </h4>
                    
                    <div className="space-y-2">
                      <Button
                        onClick={handleExportSettings}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Settings
                      </Button>

                      <Button
                        onClick={handleImportSettings}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                      </Button>

                      <Separator />

                      {!showResetConfirm ? (
                        <Button
                          onClick={() => setShowResetConfirm(true)}
                          variant="outline"
                          className="w-full justify-start text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset to Defaults
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-orange-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            This will reset all settings to defaults
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleResetSettings}
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              onClick={() => setShowResetConfirm(false)}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {!showClearDataConfirm ? (
                        <Button
                          onClick={() => setShowClearDataConfirm(true)}
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Data
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            This will permanently delete all data
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleClearAllData}
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              onClick={() => setShowClearDataConfirm(false)}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>

          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Settings are automatically saved locally
            </p>
            <Button onClick={() => onOpenChange(false)} className="linguala-button">
              Close
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}