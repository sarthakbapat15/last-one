'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Lock, RotateCcw, Save, Settings, ChefHat, Sofa, BedDouble } from 'lucide-react'

const ADMIN_PASSWORD = 'pioneerkitchens2026'

// ── Rate entry definition ──
interface RateEntry {
  label: string
  path: string[] // e.g. ['bedroomWardrobeFinish', 'SF'] or ['bedroomLoftFinish', 'Frame', 'SF']
}

interface RateSection {
  title: string
  icon: React.ReactNode
  entries: RateEntry[]
}

// ── All configurable rates organized by section ──
export const RATE_SECTIONS: RateSection[] = [
  {
    title: 'Kitchen',
    icon: <ChefHat className="w-4 h-4" />,
    entries: [
      { label: 'Ply Verticals / sqft', path: ['plyVerticals'] },
      { label: 'Tandem Drawers — Olive', path: ['tandemDrawers', 'Olive'] },
      { label: 'Tandem Drawers — Blum', path: ['tandemDrawers', 'Blum'] },
      { label: 'Tandem Drawers — Hettich', path: ['tandemDrawers', 'Hettich'] },
      { label: 'Dustbin BTD — Olive', path: ['dustbinBTD', 'Olive'] },
      { label: 'Dustbin BTD — Blum', path: ['dustbinBTD', 'Blum'] },
      { label: 'Dustbin BTD — Hettich', path: ['dustbinBTD', 'Hettich'] },
      { label: 'Bottle Pullout — Olive', path: ['bottlePullout', 'Olive'] },
      { label: 'Bottle Pullout — Blum', path: ['bottlePullout', 'Blum'] },
      { label: 'Bottle Pullout — Hettich', path: ['bottlePullout', 'Hettich'] },
      { label: 'Wicker Basket — Olive', path: ['wickerBasket', 'Olive'] },
      { label: 'Wicker Basket — Hettich', path: ['wickerBasket', 'Hettich'] },
      { label: 'Overhead Loft — Frame / sqft', path: ['overheadLoft', 'Frame Loft'] },
      { label: 'Overhead Loft — Box / sqft', path: ['overheadLoft', 'Box Loft'] },
      { label: 'Overhead Finish (Frame) — SF / sqft', path: ['overheadFinish', 'SF'] },
      { label: 'Overhead Finish (Frame) — HGL / sqft', path: ['overheadFinish', 'HGL'] },
      { label: 'Overhead Finish (Frame) — Acrylic', path: ['overheadFinish', 'Acrylic'] },
      { label: 'Overhead Finish (Frame) — Laminate', path: ['overheadFinish', 'Laminate'] },
      { label: 'Overhead Finish (Frame) — PU', path: ['overheadFinish', 'PU'] },
      { label: 'Box Loft 450mm — SF / sqft', path: ['overheadBoxLoftFinish', '450mm', 'SF'] },
      { label: 'Box Loft 450mm — HGL / sqft', path: ['overheadBoxLoftFinish', '450mm', 'HGL'] },
      { label: 'Box Loft 600mm — SF / sqft', path: ['overheadBoxLoftFinish', '600mm', 'SF'] },
      { label: 'Box Loft 600mm — HGL / sqft', path: ['overheadBoxLoftFinish', '600mm', 'HGL'] },
      { label: 'Tall Unit 450mm — SF / sqft', path: ['tallUnitFinishByDepth', '450mm', 'SF'] },
      { label: 'Tall Unit 450mm — HGL / sqft', path: ['tallUnitFinishByDepth', '450mm', 'HGL'] },
      { label: 'Tall Unit 450mm — MR+ / sqft', path: ['tallUnitFinishByDepth', '450mm', 'MR+'] },
      { label: 'Tall Unit 450mm — Acrylic / sqft', path: ['tallUnitFinishByDepth', '450mm', 'Acrylic'] },
      { label: 'Tall Unit 600mm — SF / sqft', path: ['tallUnitFinishByDepth', '600mm', 'SF'] },
      { label: 'Tall Unit 600mm — MR+ / sqft', path: ['tallUnitFinishByDepth', '600mm', 'MR+'] },
      { label: 'Tall Unit 600mm — HGL / sqft', path: ['tallUnitFinishByDepth', '600mm', 'HGL'] },
      { label: 'Tall Unit 600mm — Acrylic / sqft', path: ['tallUnitFinishByDepth', '600mm', 'Acrylic'] },
      { label: 'Tall Pantry Finish — SF', path: ['tallPantryFinish', 'SF'] },
      { label: 'Tall Pantry Finish — HGL', path: ['tallPantryFinish', 'HGL'] },
      { label: 'Tall Pantry Finish — Acrylic', path: ['tallPantryFinish', 'Acrylic'] },
      { label: 'Tall Pantry Finish — Glass Acrylic', path: ['tallPantryFinish', 'Glass Acrylic'] },
      { label: 'Pantry Accessory — Pullout', path: ['pantryAccessories', 'Pullout'] },
      { label: 'Pantry Accessory — Openable (6+6)', path: ['pantryAccessories', 'Openable (6+6 basket)'] },
      { label: 'Countertop — Granite / sqft', path: ['countertopMaterial', 'Granite'] },
      { label: 'Countertop — Quartz / sqft', path: ['countertopMaterial', 'Quartz'] },
      { label: 'Base Carcase / sqft', path: ['baseCarcase'] },
      { label: 'Kitchen Paneling — SF / sqft', path: ['kitchenPaneling', 'SF'] },
      { label: 'Kitchen Paneling — Gloss (MR+) / sqft', path: ['kitchenPaneling', 'Gloss (MR+)'] },
      { label: 'Kitchen Paneling — HGL / sqft', path: ['kitchenPaneling', 'HGL'] },
      { label: 'Kitchen Paneling — Acrylic / sqft', path: ['kitchenPaneling', 'Acrylic'] },
      { label: 'Overhead Cabinet — SF', path: ['overheadCabinetFinish', 'SF'] },
      { label: 'Overhead Cabinet — HGL', path: ['overheadCabinetFinish', 'HGL'] },
      { label: 'Overhead Cabinet — Acrylic', path: ['overheadCabinetFinish', 'Acrylic'] },
      { label: 'Overhead Cabinet — Glass Acrylic', path: ['overheadCabinetFinish', 'Glass Acrylic'] },
    ],
  },
  {
    title: 'Living Room',
    icon: <Sofa className="w-4 h-4" />,
    entries: [
      { label: 'Finish — SF / sqft', path: ['livingRoomFinish', 'SF'] },
      { label: 'Finish — HGL / sqft', path: ['livingRoomFinish', 'HGL'] },
      { label: 'Finish — Acrylic / sqft', path: ['livingRoomFinish', 'Acrylic'] },
      { label: 'Finish — Veneer with polish / sqft', path: ['livingRoomFinish', 'Veneer with polish'] },
      { label: 'Tall Unit — SF / sqft', path: ['livingRoomTallUnitFinish', 'SF'] },
      { label: 'Tall Unit — HGL / sqft', path: ['livingRoomTallUnitFinish', 'HGL'] },
      { label: 'Tall Unit — Acrylic / sqft', path: ['livingRoomTallUnitFinish', 'Acrylic'] },
      { label: 'Tall Unit — Veneer with polish / sqft', path: ['livingRoomTallUnitFinish', 'Veneer with polish'] },
      { label: 'Back Panel — HGL / sqft', path: ['backPanelFinish', 'HGL'] },
      { label: 'Back Panel — SF / sqft', path: ['backPanelFinish', 'SF'] },
      { label: 'Back Panel — Acrylic / sqft', path: ['backPanelFinish', 'Acrylic'] },
      { label: 'Back Panel — Veneer / sqft', path: ['backPanelFinish', 'Veneer'] },
      { label: 'Ledge / Shelf / sqft', path: ['ledgeShelf'] },
      { label: 'Fluted Panel / piece', path: ['flutedPanel'] },
      { label: 'Sitting with Cushion / sqft', path: ['sittingWithCushion'] },
    ],
  },
  {
    title: 'Bedroom',
    icon: <BedDouble className="w-4 h-4" />,
    entries: [
      { label: 'Wardrobe Finish — SF / sqft', path: ['bedroomWardrobeFinish', 'SF'] },
      { label: 'Wardrobe Finish — HGL / sqft', path: ['bedroomWardrobeFinish', 'HGL'] },
      { label: 'Wardrobe Finish — Acrylic / sqft', path: ['bedroomWardrobeFinish', 'Acrylic'] },
      { label: 'Wardrobe Sliding Mechanism', path: ['bedroomWardrobeSlidingMechanism'] },
      { label: 'Loft (Frame) — SF / sqft', path: ['bedroomLoftFinish', 'Frame', 'SF'] },
      { label: 'Loft (Frame) — HGL / sqft', path: ['bedroomLoftFinish', 'Frame', 'HGL'] },
      { label: 'Loft (Frame) — Acrylic / sqft', path: ['bedroomLoftFinish', 'Frame', 'Acrylic'] },
      { label: 'Loft (Box) — SF / sqft', path: ['bedroomLoftFinish', 'Box', 'SF'] },
      { label: 'Loft (Box) — HGL / sqft', path: ['bedroomLoftFinish', 'Box', 'HGL'] },
      { label: 'Loft (Box) — Acrylic / sqft', path: ['bedroomLoftFinish', 'Box', 'Acrylic'] },
      { label: 'Tall Unit Finish — SF / sqft', path: ['bedroomTallUnitFinish', 'SF'] },
      { label: 'Tall Unit Finish — HGL / sqft', path: ['bedroomTallUnitFinish', 'HGL'] },
      { label: 'Tall Unit Finish — Acrylic / sqft', path: ['bedroomTallUnitFinish', 'Acrylic'] },
      { label: 'Tall Unit Finish — Veneer / sqft', path: ['bedroomTallUnitFinish', 'Veneer with polish'] },
      { label: 'Head Board — Laminated / sqft', path: ['bedroomHeadBoardRates', 'Laminated'] },
      { label: 'Head Board — Cushioned / sqft', path: ['bedroomHeadBoardRates', 'Cushioned'] },
      { label: 'Open Bed with Legs (fixed)', path: ['bedroomOpenBedPrice'] },
      { label: 'Hydraulic Mechanism (add-on)', path: ['bedroomHydraulicMechanismPrice'] },
    ],
  },
]

// ── Helpers ──
function getNestedValue(obj: Record<string, any>, path: string[]): number {
  return path.reduce((o: any, k) => o?.[k], obj) ?? 0
}

function setNestedValue(obj: Record<string, any>, path: string[], value: number): Record<string, any> {
  const copy = JSON.parse(JSON.stringify(obj))
  let current: any = copy
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]]
  }
  current[path[path.length - 1]] = value
  return copy
}

// ── 2-level deep merge: defaults ⊕ overrides ──
export function mergePrices(defaults: Record<string, any>, overrides: Record<string, any>) {
  const result: Record<string, any> = {}
  for (const key of Object.keys(defaults)) {
    if (
      typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key]) &&
      typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key])
    ) {
      // Both are objects — go one level deeper
      const inner: Record<string, any> = {}
      for (const k of Object.keys(defaults[key])) {
        if (
          typeof defaults[key][k] === 'object' && defaults[key][k] !== null && !Array.isArray(defaults[key][k]) &&
          typeof overrides[key]?.[k] === 'object' && overrides[key]?.[k] !== null && !Array.isArray(overrides[key]?.[k])
        ) {
          inner[k] = { ...defaults[key][k], ...overrides[key][k] }
        } else {
          inner[k] = (overrides[key]?.[k] !== undefined) ? overrides[key][k] : defaults[key][k]
        }
      }
      result[key] = inner
    } else {
      result[key] = (key in overrides) ? overrides[key] : defaults[key]
    }
  }
  return result
}

// ── Props ──
interface RateSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPrices: Record<string, any>
  currentPrices: Record<string, any>
  onSave: (updatedPrices: Record<string, any>) => void
  onReset: () => void
}

export default function RateSettingsDialog({
  open,
  onOpenChange,
  defaultPrices,
  currentPrices,
  onSave,
  onReset,
}: RateSettingsDialogProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [editingPrices, setEditingPrices] = useState<Record<string, any>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setPasswordError('')
      setEditingPrices(JSON.parse(JSON.stringify(currentPrices)))
      setHasChanges(false)
    } else {
      setPasswordError('Incorrect password')
    }
  }

  const handleRateChange = (path: string[], value: string) => {
    const num = parseFloat(value) || 0
    const updated = setNestedValue(editingPrices, path, num)
    setEditingPrices(updated)
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(editingPrices)
    setHasChanges(false)
    onOpenChange(false)
    setAuthenticated(false)
    setPassword('')
  }

  const handleReset = () => {
    onReset()
    setEditingPrices(JSON.parse(JSON.stringify(defaultPrices)))
    setHasChanges(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAuthenticated(false)
      setPassword('')
      setPasswordError('')
      setHasChanges(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Rate Settings
          </DialogTitle>
          <DialogDescription>
            {authenticated
              ? 'Edit material rates and costs. Changes are saved locally.'
              : 'Enter the admin password to manage rates.'}
          </DialogDescription>
        </DialogHeader>

        {!authenticated ? (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">This section is password-protected. Only authorized personnel can modify rates.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            </div>
            <Button className="w-full" onClick={handlePasswordSubmit}>
              Unlock Settings
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-6">
              <div className="space-y-6 pb-4">
                {RATE_SECTIONS.map((section, si) => (
                  <div key={section.title}>
                    {si > 0 && <Separator className="mb-6" />}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                        {section.icon}
                      </div>
                      <h3 className="font-semibold text-sm">{section.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {section.entries.map((entry) => {
                        const currentValue = getNestedValue(editingPrices, entry.path)
                        const defaultValue = getNestedValue(defaultPrices, entry.path)
                        const isChanged = currentValue !== defaultValue
                        return (
                          <div
                            key={entry.path.join('.')}
                            className={`flex items-center gap-3 p-2 rounded-md ${isChanged ? 'bg-amber-50 border border-amber-200' : ''}`}
                          >
                            <Label className="text-xs text-muted-foreground flex-1 min-w-0 truncate" title={entry.label}>
                              {entry.label}
                            </Label>
                            <div className="relative w-32 shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                className="pl-7 h-8 text-xs text-right"
                                value={currentValue || ''}
                                onChange={(e) => handleRateChange(entry.path, e.target.value)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between shrink-0">
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Defaults
              </Button>
              <Button size="sm" className="gap-2" disabled={!hasChanges} onClick={handleSave}>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}