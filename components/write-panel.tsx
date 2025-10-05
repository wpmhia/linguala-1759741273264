"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Writing styles
const WRITING_STYLES = [
  { value: 'simple', label: 'Simple' },
  { value: 'business', label: 'Business' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' }
]

const TONES = [
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'confident', label: 'Confident' },
  { value: 'diplomatic', label: 'Diplomatic' }
]

interface WritePanelProps {
  correctionsOnly: boolean
  writingStyle: string
  tone: string
  onCorrectionsOnlyChange: (value: boolean) => void
  onWritingStyleChange: (value: string) => void
  onToneChange: (value: string) => void
}

export default function WritePanel({
  correctionsOnly,
  writingStyle,
  tone,
  onCorrectionsOnlyChange,
  onWritingStyleChange,
  onToneChange
}: WritePanelProps) {
  return (
    <div className="space-y-6">
      {/* Write Mode Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 linguala-glass rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="corrections-only" className="text-sm font-medium">Corrections only</Label>
            <Switch
              id="corrections-only"
              checked={correctionsOnly}
              onCheckedChange={onCorrectionsOnlyChange}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Style</Label>
              <Select value={writingStyle} onValueChange={onWritingStyleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WRITING_STYLES.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Tone</Label>
              <Select value={tone} onValueChange={onToneChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(toneOption => (
                    <SelectItem key={toneOption.value} value={toneOption.value}>
                      {toneOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}