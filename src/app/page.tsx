'use client'

import { useState, useEffect, Fragment } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, RotateCcw, Calculator, FileDown, IndianRupee, BedDouble, Settings, Plus, Trash2, Percent, Save, FolderOpen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BedroomTypeCards, { createEmptyBedroom, DEFAULT_TALL_UNIT_FINISH_RATES, type BedroomData } from '@/components/bedroom-type-cards'
import RateSettingsDialog, { mergePrices } from '@/components/rate-settings-dialog'
import SavedEstimatesDialog from '@/components/saved-estimates-dialog'

const DEFAULT_PRICES = {
  tandemDrawers: { Olive: 8000, Blum: 12000, Hettich: 12000 },
  dustbinBTD: { Olive: 7500, Blum: 7500, Hettich: 7500 },
  bottlePullout: { Olive: 8000, Blum: 8000, Hettich: 8000 },
  wickerBasket: { Olive: 7500, Hettich: 7500 },
  plyVerticals: 1500,
  overheadLoft: { 'Frame Loft': 1150, 'Box Loft': 1250 },
  overheadFinish: { SF: 1125, HGL: 1450, Acrylic: 1850, Laminate: 1200, PU: 1600 },
  tallPantryFinish: { SF: 1450, HGL: 1550, Acrylic: 1850, 'Glass Acrylic': 2150 },
  tallUnitFinishByDepth: {
    '450mm': { SF: 2100, HGL: 2450, 'MR+': 2350, Acrylic: 2900 },
    '600mm': { SF: 2125, 'MR+': 2375, HGL: 2500, Acrylic: 2950 },
  },
  overheadBoxLoftFinish: {
    '450mm': { SF: 1625, HGL: 1875 },
    '600mm': { SF: 1650, HGL: 2050 },
  },
  pantryAccessories: { Pullout: 21000, 'Openable (6+6 basket)': 40000 },
  livingRoomFinish: { SF: 1250, HGL: 1350, Acrylic: 1550, 'Veneer with polish': 1750 },
  livingRoomTallUnitFinish: { SF: 1250, HGL: 1350, Acrylic: 1850, 'Veneer with polish': 1750 },
  backPanelFinish: { HGL: 650, SF: 550, Acrylic: 1175, Veneer: 950 },
  ledgeShelf: 350,
  flutedPanel: 900,
  sittingWithCushion: 1350,
  countertopMaterial: { Granite: 550, Quartz: 650 },
  baseCarcase: 1650,
  kitchenPaneling: { SF: 800, 'Gloss (MR+)': 1150, HGL: 1350, Acrylic: 1450 },
  overheadCabinetFinish: { SF: 1550, HGL: 2150, Acrylic: 2650, 'Glass Acrylic': 2850 },
  profileShutterGlass: { 'Clear Glass': 350, 'Fluted Glass': 450, 'Tinted Glass': 475, 'Frosted Glass': 525, 'Lacquered Glass': 750 },
  magicCorner: { 'Type 1': 28000, 'Type 2': 38000, 'Type 3': 54000 },
  rollingShutter: { PVC: 21000, Glass: 27000 },
  vanityClosing: {
    Frame: { SF: 1300, Gloss: 1400 },
    Carcase: { SF: 1800, Gloss: 1900 },
  },
  bedroomWardrobeFinish: { SF: 1550, HGL: 1650, Acrylic: 2150 },
  bedroomWardrobeSlidingMechanism: 15000,
  bedroomLoftFinish: {
    Frame: { SF: 1150, HGL: 1250, Acrylic: 1850 },
    Box: { SF: 1250, HGL: 1350, Acrylic: 1950 },
  },
  bedroomTallUnitFinish: { ...DEFAULT_TALL_UNIT_FINISH_RATES },
  bedroomHeadBoardRates: { Laminated: 700, Cushioned: 850 },
  bedroomOpenBedPrice: 35000,
  bedroomHydraulicMechanismPrice: 25000,
}

// Bump this whenever DEFAULT_PRICES keys/values change so stale localStorage overrides are cleared
const RATE_VERSION = 'v4'

type KitchenType = 'Semi-Modular' | 'Full-Modular'
type ServiceType = 'Kitchen Only' | 'Full Interior'
type Brand = 'Olive' | 'Blum' | 'Hettich'
type HandleType = 'TopEdge' | 'G Profile' | 'J Profile' | 'Regular Handle'
type CountertopMaterial = 'Granite' | 'Quartz'
type LoftType = 'Frame Loft' | 'Box Loft'
type FinishType = 'SF' | 'HGL' | 'Acrylic' | 'Laminate' | 'PU'
type TallUnitDepth = '450mm' | '600mm'
type TallPantryFinishType = 'SF' | 'HGL' | 'Acrylic' | 'Glass Acrylic'
type TallUnitDepthFinishType = 'SF' | 'HGL' | 'MR+' | 'Acrylic'
type BoxLoftFinishType = 'SF' | 'HGL'
type AccessoriesType = 'Pullout' | 'Openable (6+6 basket)'
type LivingRoomFinishType = 'SF' | 'HGL' | 'Acrylic' | 'Veneer with polish'
type TallUnitFinishType = 'SF' | 'HGL' | 'Acrylic' | 'Veneer with polish'
type BackPanelFinishType = 'HGL' | 'SF' | 'Acrylic' | 'Veneer'
type OverheadCabinetFinishType = 'SF' | 'HGL' | 'Acrylic' | 'Glass Acrylic'
type ProfileShutterGlassType = 'Clear Glass' | 'Fluted Glass' | 'Tinted Glass' | 'Frosted Glass' | 'Lacquered Glass'
type MagicCornerType = 'Type 1' | 'Type 2' | 'Type 3'
type RollingShutterType = 'PVC' | 'Glass'
type VanityClosingType = 'Frame' | 'Carcase'
type VanityClosingFinishType = 'SF' | 'Gloss'

interface ComponentState {
  height: string
  width: string
  quantity: string
  price: string
  brand?: string
  material?: string
  loftType?: LoftType
  finish?: FinishType
  tallPantryFinish?: TallPantryFinishType
  accessories?: AccessoriesType
  handleType?: HandleType
  handlePrice?: string
  runningFeet?: string
  overheadCabinetFinish?: OverheadCabinetFinishType
  depth?: string
}

interface CustomComponent {
  id: string
  name: string
  height: string
  width: string
  rate: string
}

type CeilingType = 'Plain Ceiling' | 'Peripheral Ceiling' | 'Two Layer Ceiling'
type CeilingMaterial = 'Gypsum' | 'Acrylic' | 'ACP' | 'Armstrong' | 'Glass' | 'PVC'
type LightPointType = 'Primary Light Point' | 'Secondary Light Point' | 'Half Plug Point' | 'Full Plug Point' | 'Concealed Light Fitting' | 'Fan Fitting'
type PaintType = 'Luster Paint' | 'Texture Paint' | 'Plastic Paint' | 'Distemper Paint'

const MISC_PRICES = {
  ceilingMaterial: { Gypsum: 105, Acrylic: 160, ACP: 180, Armstrong: 115, Glass: 350, PVC: 125 },
  lightPoint: { 'Primary Light Point': 750, 'Secondary Light Point': 450, 'Half Plug Point': 400, 'Full Plug Point': 700, 'Concealed Light Fitting': 150, 'Fan Fitting': 150 },
  paint: { 'Luster Paint': 38, 'Texture Paint': 115, 'Plastic Paint': 33, 'Distemper Paint': 27 },
}

interface ElectricalWorkItem {
  id: string
  lightPointType: LightPointType | ''
  quantity: string
}

interface PaintingItem {
  id: string
  paintType: PaintType | ''
  totalArea: string
}

interface MiscellaneousEstimate {
  falseCeiling: { type: CeilingType | ''; material: CeilingMaterial | ''; height: string; width: string }
  electricalWork: ElectricalWorkItem[]
  painting: PaintingItem[]
}

interface KitchenEstimate {
  kitchenType: KitchenType
  components: {
    component1: ComponentState
    tandemDrawers: ComponentState
    dustbinBTD: ComponentState
    bottlePullout: ComponentState
    wickerBasket: ComponentState
    tallUnit: ComponentState
    pantryUnit: ComponentState
    baseCarcase: ComponentState
    kitchenPaneling: ComponentState
    overheadCabinet: ComponentState
    overheadLoft: ComponentState
    profileShutter: ComponentState
    magicCorner: ComponentState
    rollingShutter: ComponentState
    vanityClosing: ComponentState
    handles: ComponentState
  }
}

interface LivingRoomEstimate {
  components: {
    chestOfDrawers: ComponentState
    baseCabinet: ComponentState
    livingRoomTallUnit: ComponentState
    backPanel: ComponentState
    ledgeShelf: ComponentState
    flutedPanel: ComponentState
    shoeRack: ComponentState
    sittingWithCushion: ComponentState
  }
}

export default function Home() {
  const [clientInfo, setClientInfo] = useState({
    name: '',
    address: '',
    contact: '',
    serviceType: '' as ServiceType
  })

  const [kitchenType, setKitchenType] = useState<KitchenType | ''>('')
  const [estimate, setEstimate] = useState<KitchenEstimate>({
    kitchenType: '' as KitchenType,
    components: {
      component1: { height: '', width: '', quantity: '', price: '' },
      tandemDrawers: { brand: '', quantity: '', price: '' },
      dustbinBTD: { brand: '', quantity: '', price: '' },
      bottlePullout: { brand: '', quantity: '', price: '' },
      wickerBasket: { brand: '', quantity: '', price: '' },
      tallUnit: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '', depth: '' },
      pantryUnit: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '', accessories: '' },
      baseCarcase: { height: '', width: '', quantity: '', price: '1650' },
      kitchenPaneling: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' },
      overheadCabinet: { height: '', width: '', quantity: '', price: '', overheadCabinetFinish: '' },
      overheadLoft: { height: '', width: '', quantity: '', loftType: '', finish: '', price: '', depth: '' },
      profileShutter: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as ProfileShutterGlassType },
      magicCorner: { brand: '', quantity: '', price: '' },
      rollingShutter: { brand: '', quantity: '', price: '' },
      vanityClosing: { height: '', width: '', quantity: '', price: '', material: '' as VanityClosingType, tallPantryFinish: '' as VanityClosingFinishType },
      handles: { handleType: '', runningFeet: '', handlePrice: '' }
    }
  })

  const [livingRoomEstimate, setLivingRoomEstimate] = useState<LivingRoomEstimate>({
    components: {
      chestOfDrawers: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as LivingRoomFinishType },
      baseCabinet: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as LivingRoomFinishType },
      livingRoomTallUnit: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as TallUnitFinishType },
      backPanel: { height: '', width: '', quantity: '', price: '', loftType: '' as BackPanelFinishType },
      ledgeShelf: { height: '', width: '', quantity: '', price: '350' },
      flutedPanel: { quantity: '', price: '900' },
      shoeRack: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as LivingRoomFinishType },
      sittingWithCushion: { height: '', width: '', quantity: '', price: '1350' }
    }
  })

  type BedroomCategory = 'master' | 'guest' | 'kids'
  interface BedroomsEstimate {
    master: BedroomData
    guest: BedroomData
    kids: BedroomData
  }

  const [bedroomsEstimate, setBedroomsEstimate] = useState<BedroomsEstimate>({
    master: createEmptyBedroom(),
    guest: createEmptyBedroom(),
    kids: createEmptyBedroom(),
  })

  const [exporting, setExporting] = useState(false)
  const [logoSettingsOpen, setLogoSettingsOpen] = useState(false)
  const [logoSettings, setLogoSettings] = useState({
    width: 350,
    height: 140,
    position: 'center' as 'left' | 'center' | 'right',
  })
  const [selectedDiscount, setSelectedDiscount] = useState(0)

  const [prices, setPrices] = useState<typeof DEFAULT_PRICES>({ ...DEFAULT_PRICES })
  const [ratesLoaded, setRatesLoaded] = useState(false)

  // Load rates from DB on mount (falls back to localStorage)
  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch('/api/settings/rates')
        if (res.ok) {
          const data = await res.json()
          if (data.overrides && data.version === RATE_VERSION) {
            setPrices(mergePrices(DEFAULT_PRICES, data.overrides))
          } else {
            // DB version mismatch or empty — try localStorage fallback
            const saved = localStorage.getItem('rateOverrides')
            if (saved) setPrices(mergePrices(DEFAULT_PRICES, JSON.parse(saved)))
          }
        } else {
          // API failed — fall back to localStorage
          const saved = localStorage.getItem('rateOverrides')
          if (saved) setPrices(mergePrices(DEFAULT_PRICES, JSON.parse(saved)))
        }
      } catch {
        const saved = localStorage.getItem('rateOverrides')
        if (saved) setPrices(mergePrices(DEFAULT_PRICES, JSON.parse(saved)))
      } finally {
        setRatesLoaded(true)
      }
    }
    loadRates()
  }, [])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savedDialogOpen, setSavedDialogOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [kitchenCustomComponents, setKitchenCustomComponents] = useState<CustomComponent[]>([])
  const [livingRoomCustomComponents, setLivingRoomCustomComponents] = useState<CustomComponent[]>([])
  const [bedroomCustomComponents, setBedroomCustomComponents] = useState<Record<BedroomCategory, CustomComponent[]>>({
    master: [], guest: [], kids: []
  })

  const [miscEstimate, setMiscEstimate] = useState<MiscellaneousEstimate>({
    falseCeiling: { type: '', material: '', height: '', width: '' },
    electricalWork: [],
    painting: [],
  })

  const [postformingRate, setPostformingRate] = useState('')

  // Helper: get effective rate — if finish is Postforming, use manual rate
  const getEffectiveRate = (finish: string | undefined, rateMap: Record<string, number>): number => {
    if (!finish) return 0
    if (finish === 'Postforming') return parseFloat(postformingRate) || 0
    return rateMap[finish] || 0
  }

  const handleSaveRates = async (updated: Record<string, any>) => {
    const merged = mergePrices(DEFAULT_PRICES, updated)
    setPrices(merged)
    // Save to DB (syncs across devices)
    try {
      await fetch('/api/settings/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: updated, version: RATE_VERSION }),
      })
    } catch { /* DB save failed — still works locally */ }
    // Also keep localStorage as cache
    localStorage.setItem('rateOverrides', JSON.stringify(updated))
    localStorage.setItem('rateOverridesVersion', RATE_VERSION)
  }

  const handleResetRates = async () => {
    setPrices({ ...DEFAULT_PRICES })
    // Clear from DB
    try {
      await fetch('/api/settings/rates', { method: 'DELETE' })
    } catch { /* ignore */ }
    localStorage.removeItem('rateOverrides')
  }

  // ── Custom Component Helpers ──
  const addCustomComponent = (setter: React.Dispatch<React.SetStateAction<CustomComponent[]>>) => {
    setter(prev => [...prev, { id: crypto.randomUUID(), name: '', height: '', width: '', rate: '' }])
  }

  const removeCustomComponent = (setter: React.Dispatch<React.SetStateAction<CustomComponent[]>>, id: string) => {
    setter(prev => prev.filter(c => c.id !== id))
  }

  const updateCustomComponent = (setter: React.Dispatch<React.SetStateAction<CustomComponent[]>>, id: string, field: keyof CustomComponent, value: string) => {
    setter(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const addBedroomCustomComponent = (cat: BedroomCategory) => {
    setBedroomCustomComponents(prev => ({
      ...prev,
      [cat]: [...prev[cat], { id: crypto.randomUUID(), name: '', height: '', width: '', finish: '' }]
    }))
  }

  const removeBedroomCustomComponent = (cat: BedroomCategory, id: string) => {
    setBedroomCustomComponents(prev => ({
      ...prev,
      [cat]: prev[cat].filter(c => c.id !== id)
    }))
  }

  const updateBedroomCustomComponent = (cat: BedroomCategory, id: string, field: keyof CustomComponent, value: string) => {
    setBedroomCustomComponents(prev => ({
      ...prev,
      [cat]: prev[cat].map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }

  // ── Miscellaneous Helpers ──
  const updateMisc = (field: keyof MiscellaneousEstimate['falseCeiling'], value: string) => {
    setMiscEstimate(prev => ({
      ...prev,
      falseCeiling: { ...prev.falseCeiling, [field]: value }
    }))
  }

  const addElectricalItem = () => {
    setMiscEstimate(prev => ({
      ...prev,
      electricalWork: [...prev.electricalWork, { id: crypto.randomUUID(), lightPointType: '', quantity: '' }]
    }))
  }
  const removeElectricalItem = (id: string) => {
    setMiscEstimate(prev => ({
      ...prev,
      electricalWork: prev.electricalWork.filter(i => i.id !== id)
    }))
  }
  const updateElectricalItem = (id: string, field: keyof ElectricalWorkItem, value: string) => {
    setMiscEstimate(prev => ({
      ...prev,
      electricalWork: prev.electricalWork.map(i => i.id === id ? { ...i, [field]: value } : i)
    }))
  }

  const addPaintingItem = () => {
    setMiscEstimate(prev => ({
      ...prev,
      painting: [...prev.painting, { id: crypto.randomUUID(), paintType: '', totalArea: '' }]
    }))
  }
  const removePaintingItem = (id: string) => {
    setMiscEstimate(prev => ({
      ...prev,
      painting: prev.painting.filter(i => i.id !== id)
    }))
  }
  const updatePaintingItem = (id: string, field: keyof PaintingItem, value: string) => {
    setMiscEstimate(prev => ({
      ...prev,
      painting: prev.painting.map(i => i.id === id ? { ...i, [field]: value } : i)
    }))
  }

  const calculateSqft = (height: string, width: string): number => {
    const h = parseFloat(height) || 0
    const w = parseFloat(width) || 0
    return (h * w) / 92903
  }

  // ── Miscellaneous Calculations ──
  const falseCeilingCost = (() => {
    const fc = miscEstimate.falseCeiling
    const sqft = calculateSqft(fc.height, fc.width)
    const rate = fc.material ? (MISC_PRICES.ceilingMaterial[fc.material as CeilingMaterial] || 0) : 0
    return sqft * rate
  })()

  const electricalWorkCost = (() => {
    return miscEstimate.electricalWork.reduce((sum, ew) => {
      const rate = ew.lightPointType ? (MISC_PRICES.lightPoint[ew.lightPointType as LightPointType] || 0) : 0
      const qty = parseFloat(ew.quantity) || 0
      return sum + (rate * qty)
    }, 0)
  })()

  const paintingCost = (() => {
    return miscEstimate.painting.reduce((sum, p) => {
      const rate = p.paintType ? (MISC_PRICES.paint[p.paintType as PaintType] || 0) : 0
      const area = parseFloat(p.totalArea) || 0
      return sum + (rate * area)
    }, 0)
  })()

  const totalMiscellaneousCost = falseCeilingCost + electricalWorkCost + paintingCost

  const calculateCustomComponentCost = (comp: CustomComponent): number => {
    const sqft = calculateSqft(comp.height, comp.width)
    const rate = parseFloat(comp.rate) || 0
    return sqft * rate
  }

  const calculateComponentTotal = (component: keyof KitchenEstimate['components']): number => {
    const comp = estimate.components[component]

    switch (component) {
      case 'component1':
        if (kitchenType === 'Semi-Modular') {
          const qty = parseFloat(comp.quantity) || 0
          return qty * prices.plyVerticals
        } else {
          const sqft = calculateSqft(comp.height, comp.width)
          const basePrice = comp.material && prices.countertopMaterial[comp.material as keyof typeof prices.countertopMaterial] ? prices.countertopMaterial[comp.material as keyof typeof prices.countertopMaterial] : prices.countertopMaterial.Granite
          return sqft * basePrice
        }

      case 'tandemDrawers': {
        const brand = comp.brand as Brand
        if (brand && prices.tandemDrawers[brand]) {
          const qty = parseFloat(comp.quantity) || 0
          return qty * prices.tandemDrawers[brand]
        }
        return 0
      }

      case 'dustbinBTD': {
        const dustbinBrand = comp.brand as Brand
        if (dustbinBrand && prices.dustbinBTD[dustbinBrand]) {
          const qty = parseFloat(comp.quantity) || 0
          return qty * prices.dustbinBTD[dustbinBrand]
        }
        return 0
      }

      case 'bottlePullout': {
        const bottleBrand = comp.brand as Brand
        if (bottleBrand && prices.bottlePullout[bottleBrand]) {
          const qty = parseFloat(comp.quantity) || 0
          return qty * prices.bottlePullout[bottleBrand]
        }
        return 0
      }

      case 'wickerBasket': {
        const wickerBrand = comp.brand as Brand
        if (wickerBrand && prices.wickerBasket[wickerBrand]) {
          const qty = parseFloat(comp.quantity) || 0
          return qty * prices.wickerBasket[wickerBrand]
        }
        return 0
      }

      case 'tallUnit': {
        const tallSqft = calculateSqft(comp.height, comp.width)
        const depth = (comp.depth || '450mm') as TallUnitDepth
        const tallFinish = comp.tallPantryFinish as TallUnitDepthFinishType
        if (tallFinish === 'Postforming') return tallSqft * (parseFloat(postformingRate) || 0)
        const depthPrices = prices.tallUnitFinishByDepth[depth]
        const rate = depthPrices?.[tallFinish] || 0
        return tallSqft * rate
      }

      case 'pantryUnit': {
        const pantrySqft = calculateSqft(comp.height, comp.width)
        const pantryFinish = comp.tallPantryFinish
        let pantryTotal = 0
        const pantryRate = getEffectiveRate(pantryFinish, prices.tallPantryFinish)
        if (pantryRate > 0) {
          pantryTotal = pantrySqft * pantryRate
        }
        const accessories = comp.accessories as AccessoriesType
        if (accessories && prices.pantryAccessories[accessories]) {
          pantryTotal += prices.pantryAccessories[accessories]
        }
        return pantryTotal
      }

      case 'baseCarcase': {
        const baseCarcaseSqft = calculateSqft(comp.height, comp.width)
        return baseCarcaseSqft * prices.baseCarcase
      }

      case 'kitchenPaneling': {
        const panelingSqft = calculateSqft(comp.height, comp.width)
        const panelingFinish = comp.tallPantryFinish
        const panelingRate = getEffectiveRate(panelingFinish, prices.kitchenPaneling)
        return panelingSqft * panelingRate
      }

      case 'overheadCabinet': {
        const overheadCabinetSqft = calculateSqft(comp.height, comp.width)
        const ohcRate = getEffectiveRate(comp.overheadCabinetFinish, prices.overheadCabinetFinish)
        return overheadCabinetSqft * ohcRate
      }

      case 'overheadLoft': {
        const loftSqft = calculateSqft(comp.height, comp.width)
        const loftType = comp.loftType as LoftType
        const finish = comp.finish
        if (loftType === 'Box Loft') {
          const depth = (comp.depth || '450mm') as TallUnitDepth
          if (finish === 'Postforming') return loftSqft * (parseFloat(postformingRate) || 0)
          const boxPrices = prices.overheadBoxLoftFinish[depth]
          const rate = boxPrices?.[finish as BoxLoftFinishType] || 0
          return loftSqft * rate
        }
        if (loftType && prices.overheadLoft[loftType]) {
          const basePrice = prices.overheadLoft[loftType]
          const finishPrice = getEffectiveRate(finish, prices.overheadFinish)
          return loftSqft * (basePrice + finishPrice)
        }
        return 0
      }

      case 'profileShutter': {
        const sqft = calculateSqft(comp.height, comp.width)
        const glassType = comp.tallPantryFinish as ProfileShutterGlassType
        const rate = glassType ? (prices.profileShutterGlass[glassType] || 0) : 0
        return sqft * rate
      }

      case 'magicCorner': {
        const mcType = comp.brand as MagicCornerType
        if (mcType && prices.magicCorner[mcType]) {
          return prices.magicCorner[mcType]
        }
        return 0
      }

      case 'rollingShutter': {
        const rsType = comp.brand as RollingShutterType
        if (rsType && prices.rollingShutter[rsType]) {
          return prices.rollingShutter[rsType]
        }
        return 0
      }

      case 'vanityClosing': {
        const vcType = comp.material as VanityClosingType
        const vcFinish = comp.tallPantryFinish as VanityClosingFinishType
        if (vcType && vcFinish && prices.vanityClosing[vcType]) {
          const rate = prices.vanityClosing[vcType][vcFinish] || 0
          return calculateSqft(comp.height, comp.width) * rate
        }
        return 0
      }

      case 'handles': {
        const handleFeet = parseFloat(comp.runningFeet) || 0
        const handlePrice = parseFloat(comp.handlePrice) || 0
        return handleFeet * handlePrice
      }

      default:
        return 0
    }
  }

  const totalEstimatedCost = Object.keys(estimate.components).reduce((total, key) => {
    return total + calculateComponentTotal(key as keyof KitchenEstimate['components'])
  }, 0) + kitchenCustomComponents.reduce(
    (sum, comp) => sum + calculateCustomComponentCost(comp), 0
  )

  const updateComponent = (component: keyof KitchenEstimate['components'], field: string, value: string) => {
    setEstimate(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: { ...prev.components[component], [field]: value }
      }
    }))
  }

  const updateLivingRoomComponent = (component: keyof LivingRoomEstimate['components'], field: string, value: string) => {
    setLivingRoomEstimate(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: { ...prev.components[component], [field]: value }
      }
    }))
  }

  const calculateLivingRoomComponentTotal = (component: keyof LivingRoomEstimate['components']): number => {
    const comp = livingRoomEstimate.components[component]

    switch (component) {
      case 'chestOfDrawers':
      case 'baseCabinet':
      case 'shoeRack': {
        const sqft = calculateSqft(comp.height, comp.width)
        const rate = getEffectiveRate(comp.tallPantryFinish, prices.livingRoomFinish)
        return sqft * rate
      }

      case 'livingRoomTallUnit': {
        const sqft = calculateSqft(comp.height, comp.width)
        const rate = getEffectiveRate(comp.tallPantryFinish, prices.livingRoomTallUnitFinish)
        return sqft * rate
      }

      case 'backPanel': {
        const sqft = calculateSqft(comp.height, comp.width)
        const rate = getEffectiveRate(comp.loftType, prices.backPanelFinish)
        return sqft * rate
      }

      case 'ledgeShelf': {
        const sqft = calculateSqft(comp.height, comp.width)
        const qty = parseFloat(comp.quantity) || 1
        return sqft * prices.ledgeShelf * qty
      }

      case 'flutedPanel': {
        const qty = parseFloat(comp.quantity) || 0
        return qty * prices.flutedPanel
      }

      case 'sittingWithCushion': {
        const sqft = calculateSqft(comp.height, comp.width)
        return sqft * prices.sittingWithCushion
      }

      default:
        return 0
    }
  }

  const totalLivingRoomCost = Object.keys(livingRoomEstimate.components).reduce((total, key) => {
    return total + calculateLivingRoomComponentTotal(key as keyof LivingRoomEstimate['components'])
  }, 0) + livingRoomCustomComponents.reduce(
    (sum, comp) => sum + calculateCustomComponentCost(comp), 0
  )

  // ── Bedroom Calculation Functions ──

  const calcBRSqft = (h: string, w: string) => {
    const height = parseFloat(h) || 0
    const width = parseFloat(w) || 0
    return (height * width) / 92903
  }

  const calculateWardrobeTotal = (br: BedroomData): number => {
    const sqft = calcBRSqft(br.wardrobe.height, br.wardrobe.width)
    const rate = getEffectiveRate(br.wardrobe.finish, prices.bedroomWardrobeFinish)
    let total = sqft * rate
    if (br.wardrobe.slidingMechanism) total += prices.bedroomWardrobeSlidingMechanism
    return total
  }

  const calculateBedroomLoftTotal = (br: BedroomData): number => {
    const sqft = calcBRSqft(br.loft.height, br.loft.width)
    if (br.loft.finish === 'Postforming') {
      return sqft * (parseFloat(postformingRate) || 0)
    }
    const rate = br.loft.loftType && br.loft.finish
      ? (prices.bedroomLoftFinish[br.loft.loftType]?.[br.loft.finish] || 0)
      : 0
    return sqft * rate
  }

  const calculateWindowSeatTotal = (br: BedroomData): number => {
    const sqft = calcBRSqft(br.windowSeat.height, br.windowSeat.width)
    return sqft * getEffectiveRate(br.windowSeat.finish, prices.bedroomTallUnitFinish)
  }

  const calculateStudyTableTotal = (br: BedroomData): number => {
    const baseSqft = calcBRSqft(br.studyTable.base.height, br.studyTable.base.width)
    const ohSqft = calcBRSqft(br.studyTable.overhead.height, br.studyTable.overhead.width)
    return (baseSqft + ohSqft) * getEffectiveRate(br.studyTable.finish, prices.bedroomTallUnitFinish)
  }

  const calculateDresserUnitTotal = (br: BedroomData): number => {
    const baseSqft = calcBRSqft(br.dresserUnit.baseDrawers.height, br.dresserUnit.baseDrawers.width)
    const msSqft = calcBRSqft(br.dresserUnit.mirrorWithStorage.height, br.dresserUnit.mirrorWithStorage.width)
    const mbpSqft = calcBRSqft(br.dresserUnit.mirrorOnBackPanel.height, br.dresserUnit.mirrorOnBackPanel.width)
    return (baseSqft + msSqft + mbpSqft) * getEffectiveRate(br.dresserUnit.finish, prices.bedroomTallUnitFinish)
  }

  const calculateBedTotal = (br: BedroomData): number => {
    if (br.bed.typeOfBed === 'Open Bed with Legs') return prices.bedroomOpenBedPrice
    const sqft = calcBRSqft(br.bed.height, br.bed.width)
    const rate = getEffectiveRate(br.bed.finish, prices.bedroomTallUnitFinish)
    let total = sqft * rate
    if (br.bed.typeOfBed === 'Hydraulic (Automatic)' || br.bed.typeOfBed === 'Pullout Trolly Bed') {
      total += prices.bedroomHydraulicMechanismPrice
    }
    return total
  }

  const calculateHeadBoardTotal = (br: BedroomData): number => {
    const sqft = calcBRSqft(br.headBoard.length, br.headBoard.width)
    return sqft * (prices.bedroomHeadBoardRates[br.headBoard.headBoardType] || 0)
  }

  const calculateSingleBedroomTotal = (br: BedroomData): number => {
    return calculateWardrobeTotal(br) + calculateBedroomLoftTotal(br) + calculateWindowSeatTotal(br)
      + calculateStudyTableTotal(br) + calculateDresserUnitTotal(br) + calculateBedTotal(br) + calculateHeadBoardTotal(br)
  }

  const calculateBedroomCategoryTotal = (cat: BedroomCategory): number => {
    const base = calculateSingleBedroomTotal(bedroomsEstimate[cat])
    const customTotal = bedroomCustomComponents[cat].reduce(
      (sum, comp) => sum + calculateCustomComponentCost(comp),
      0
    )
    return base + customTotal
  }

  const totalBedroomCost = calculateBedroomCategoryTotal('master')
    + calculateBedroomCategoryTotal('guest')
    + calculateBedroomCategoryTotal('kids')

  // ── Bedroom Update Handlers ──
  const updateBedroom = (category: BedroomCategory, component: string, field: string, value: string | boolean) => {
    setBedroomsEstimate(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [component]: { ...((prev[category] as Record<string, any>)[component]), [field]: value }
      }
    }))
  }

  const updateBedroomNested = (category: BedroomCategory, component: string, sub: string, field: string, value: string) => {
    setBedroomsEstimate(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [component]: {
          ...((prev[category] as Record<string, any>)[component]),
          [sub]: { ...((prev[category] as Record<string, any>)[component] as Record<string, any>)[sub], [field]: value }
        }
      }
    }))
  }

  const handleBedroomWardrobeTypeChange = (category: BedroomCategory, value: string) => {
    setBedroomsEstimate(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        wardrobe: { ...prev[category].wardrobe, wardrobeType: value, finish: '', slidingMechanism: false }
      }
    }))
  }

  const handleBedroomLoftTypeChange = (category: BedroomCategory, value: string) => {
    setBedroomsEstimate(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        loft: { ...prev[category].loft, loftType: value, finish: '' }
      }
    }))
  }

  const handleBedTypeChange = (category: BedroomCategory, value: string) => {
    setBedroomsEstimate(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        bed: { typeOfBed: value, height: '', width: '', finish: '' }
      }
    }))
  }

  const bedroomPrices = {
    wardrobeFinish: prices.bedroomWardrobeFinish,
    wardrobeSlidingMechanism: prices.bedroomWardrobeSlidingMechanism,
    bedroomLoftFinish: prices.bedroomLoftFinish,
    headBoardRates: prices.bedroomHeadBoardRates,
    openBedPrice: prices.bedroomOpenBedPrice,
    hydraulicMechanismPrice: prices.bedroomHydraulicMechanismPrice,
    tallUnitFinish: prices.bedroomTallUnitFinish,
  }

  const bedroomCategoryLabels: Record<BedroomCategory, string> = { master: 'Master Bedroom', guest: 'Guest Bedroom', kids: 'Kids Bedroom' }

  const getBedroomCardsProps = (category: BedroomCategory) => {
    const bedroom = bedroomsEstimate[category]
    return {
      bedroom,
      category,
      wardrobeTotal: calculateWardrobeTotal(bedroom),
      loftTotal: calculateBedroomLoftTotal(bedroom),
      windowSeatTotal: calculateWindowSeatTotal(bedroom),
      studyTableTotal: calculateStudyTableTotal(bedroom),
      dresserUnitTotal: calculateDresserUnitTotal(bedroom),
      bedTotal: calculateBedTotal(bedroom),
      headBoardTotal: calculateHeadBoardTotal(bedroom),
      prices: bedroomPrices,
      formatINR,
      tallUnitFinishRates: prices.bedroomTallUnitFinish,
      onUpdateWardrobe: (field: string, value: string | boolean) => updateBedroom(category, 'wardrobe', field, value),
      onWardrobeTypeChange: (value: string) => handleBedroomWardrobeTypeChange(category, value),
      onUpdateLoft: (field: string, value: string) => updateBedroom(category, 'loft', field, value),
      onLoftTypeChange: (value: string) => handleBedroomLoftTypeChange(category, value),
      onUpdateWindowSeat: (field: string, value: string) => updateBedroom(category, 'windowSeat', field, value),
      onUpdateStudyTableBase: (field: string, value: string) => updateBedroomNested(category, 'studyTable', 'base', field, value),
      onUpdateStudyTableOverhead: (field: string, value: string) => updateBedroomNested(category, 'studyTable', 'overhead', field, value),
      onStudyTableFinishChange: (value: string) => updateBedroom(category, 'studyTable', 'finish', value),
      onUpdateDresserBaseDrawers: (field: string, value: string) => updateBedroomNested(category, 'dresserUnit', 'baseDrawers', field, value),
      onUpdateDresserMirrorStorage: (field: string, value: string) => updateBedroomNested(category, 'dresserUnit', 'mirrorWithStorage', field, value),
      onUpdateDresserMirrorBackPanel: (field: string, value: string) => updateBedroomNested(category, 'dresserUnit', 'mirrorOnBackPanel', field, value),
      onDresserUnitFinishChange: (value: string) => updateBedroom(category, 'dresserUnit', 'finish', value),
      onBedTypeChange: (value: string) => handleBedTypeChange(category, value),
      onUpdateBed: (field: string, value: string) => updateBedroom(category, 'bed', field, value),
      onUpdateHeadBoard: (field: string, value: string) => updateBedroom(category, 'headBoard', field, value),
      postformingRate,
      onPostformingRateChange: (v: string) => setPostformingRate(v),
    }
  }

  const resetBedrooms = () => {
    setBedroomsEstimate({
      master: createEmptyBedroom(),
      guest: createEmptyBedroom(),
      kids: createEmptyBedroom(),
    })
  }

  const grandTotal = (clientInfo.serviceType === 'Full Interior' ? totalLivingRoomCost + totalBedroomCost : totalBedroomCost) + totalEstimatedCost + totalMiscellaneousCost
  const discountAmount = Math.round(grandTotal * selectedDiscount / 100)
  const discountedTotal = grandTotal - discountAmount

  // Track unsaved changes via beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Mark as having unsaved changes whenever relevant state changes
  useEffect(() => {
    const hasData = clientInfo.name || clientInfo.serviceType || kitchenType || grandTotal > 0
    setHasUnsavedChanges(hasData)
  }, [clientInfo, kitchenType, estimate, livingRoomEstimate, bedroomsEstimate, kitchenCustomComponents, livingRoomCustomComponents, bedroomCustomComponents, miscEstimate, selectedDiscount, postformingRate, grandTotal])

  // ── Save / Load Handlers ──
  const handleSaveEstimate = async (label: string) => {
    const payload = {
      clientInfo,
      kitchenType,
      estimate,
      livingRoomEstimate,
      bedroomsEstimate,
      kitchenCustomComponents,
      livingRoomCustomComponents,
      bedroomCustomComponents,
      miscEstimate,
      selectedDiscount,
      postformingRate,
    }
    const res = await fetch('/api/estimates/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName: clientInfo.name || 'Unnamed', label, data: payload, totalCost: grandTotal }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData?.error || `Server error (${res.status})`)
    }
    setHasUnsavedChanges(false)
  }

  const handleLoadEstimate = async (id: string) => {
    const res = await fetch(`/api/estimates/saved/${id}`)
    if (!res.ok) throw new Error('Failed to load estimate')
    const { data } = await res.json()
    if (data.clientInfo) setClientInfo(data.clientInfo)
    if (data.kitchenType) setKitchenType(data.kitchenType)
    if (data.estimate) setEstimate(data.estimate)
    if (data.livingRoomEstimate) setLivingRoomEstimate(data.livingRoomEstimate)
    if (data.bedroomsEstimate) setBedroomsEstimate(data.bedroomsEstimate)
    if (data.kitchenCustomComponents) setKitchenCustomComponents(data.kitchenCustomComponents)
    if (data.livingRoomCustomComponents) setLivingRoomCustomComponents(data.livingRoomCustomComponents)
    if (data.bedroomCustomComponents) setBedroomCustomComponents(data.bedroomCustomComponents)
    if (data.miscEstimate) setMiscEstimate(data.miscEstimate)
    if (typeof data.selectedDiscount === 'number') setSelectedDiscount(data.selectedDiscount)
    if (typeof data.postformingRate === 'string') setPostformingRate(data.postformingRate)
    setHasUnsavedChanges(false)
  }

  const handleDeleteEstimate = async (id: string) => {
    const res = await fetch(`/api/estimates/saved?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
  }

  const handleKitchenTypeChange = (value: KitchenType) => {
    setKitchenType(value)
    setEstimate(prev => ({
      ...prev,
      kitchenType: value,
      components: {
        ...prev.components,
        component1: { height: '', width: '', quantity: '', price: '', material: '' }
      }
    }))
  }

  const resetKitchenComponents = () => {
    setEstimate(prev => ({
      ...prev,
      components: {
        component1: { height: '', width: '', quantity: '', price: '', material: '' },
        tandemDrawers: { brand: '', quantity: '', price: '' },
        dustbinBTD: { brand: '', quantity: '', price: '' },
        bottlePullout: { brand: '', quantity: '', price: '' },
        wickerBasket: { brand: '', quantity: '', price: '' },
        tallUnit: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '', depth: '' },
        pantryUnit: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '', accessories: '' },
        baseCarcase: { height: '', width: '', quantity: '', price: '1650' },
        kitchenPaneling: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' },
        overheadCabinet: { height: '', width: '', quantity: '', price: '', overheadCabinetFinish: '' },
        overheadLoft: { height: '', width: '', quantity: '', loftType: '', finish: '', price: '', depth: '' },
        profileShutter: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as ProfileShutterGlassType },
        magicCorner: { brand: '', quantity: '', price: '' },
        rollingShutter: { brand: '', quantity: '', price: '' },
        vanityClosing: { height: '', width: '', quantity: '', price: '', material: '' as VanityClosingType, tallPantryFinish: '' as VanityClosingFinishType },
        handles: { handleType: '', runningFeet: '', handlePrice: '' }
      }
    }))
  }

  const resetLivingRoomComponents = () => {
    setLivingRoomEstimate({
      components: {
        chestOfDrawers: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as LivingRoomFinishType },
        baseCabinet: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as LivingRoomFinishType },
        livingRoomTallUnit: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as TallUnitFinishType },
        backPanel: { height: '', width: '', quantity: '', price: '', loftType: '' as BackPanelFinishType },
        ledgeShelf: { height: '', width: '', quantity: '', price: '350' },
        flutedPanel: { quantity: '', price: '900' },
        shoeRack: { height: '', width: '', quantity: '', price: '', tallPantryFinish: '' as LivingRoomFinishType },
        sittingWithCushion: { height: '', width: '', quantity: '', price: '1350' }
      }
    })
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/estimates/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientInfo,
          kitchenType,
          estimate,
          livingRoomEstimate,
          bedroomsEstimate,
          totalCost: grandTotal,
          kitchenCost: totalEstimatedCost,
          livingRoomCost: totalLivingRoomCost,
          bedroomCost: totalBedroomCost,
          components: estimate.components,
          logoSettings,
          kitchenCustomComponents,
          livingRoomCustomComponents,
          bedroomCustomComponents,
          miscEstimate,
          postformingRate,
          discountPercent: selectedDiscount,
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kitchen_estimate_${clientInfo.name || 'client'}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export Excel')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/estimates/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientInfo,
          kitchenType,
          estimate,
          livingRoomEstimate,
          bedroomsEstimate,
          totalCost: grandTotal,
          kitchenCost: totalEstimatedCost,
          livingRoomCost: totalLivingRoomCost,
          bedroomCost: totalBedroomCost,
          components: estimate.components,
          kitchenCustomComponents,
          livingRoomCustomComponents,
          bedroomCustomComponents,
          miscEstimate,
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kitchen_estimate_${clientInfo.name || 'client'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const getComponentLabel = (component: keyof KitchenEstimate['components']): string => {
    const labels: Record<string, string> = {
      component1: kitchenType === 'Semi-Modular' ? 'Ply Verticals' : 'Structure / Countertop',
      tandemDrawers: 'Tandem Drawers',
      dustbinBTD: 'Dustbin + BTD',
      bottlePullout: 'Bottle Pullout',
      wickerBasket: 'Wicker Basket',
      tallUnit: 'Tall Unit',
      pantryUnit: 'Pantry Unit',
      baseCarcase: 'Base Carcase',
      kitchenPaneling: 'Kitchen Paneling',
      overheadCabinet: 'Overhead Cabinet',
      overheadLoft: 'Overhead Loft',
      profileShutter: 'Profile Shutter with Glass',
      magicCorner: 'Magic Corner',
      rollingShutter: 'Rolling Shutter',
      vanityClosing: 'Vanity Closing',
      handles: 'Handles'
    }
    return labels[component] || component
  }

  const getLivingRoomComponentLabel = (component: keyof LivingRoomEstimate['components']): string => {
    const labels: Record<string, string> = {
      chestOfDrawers: 'Chest of Drawers',
      baseCabinet: 'Base Cabinet with shutters',
      livingRoomTallUnit: 'Tall Unit',
      backPanel: 'Back Panel',
      ledgeShelf: 'Ledge/Shelf',
      flutedPanel: 'Fluted Panel',
      shoeRack: 'Shoe Rack',
      sittingWithCushion: 'Sitting with Cushion'
    }
    return labels[component] || component
  }

  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  // Reusable Postforming rate input
  const PostformingRateInput = ({ selectedFinish }: { selectedFinish: string }) => {
    if (selectedFinish !== 'Postforming') return null
    return (
      <div className="mt-1.5">
        <Label className="text-xs">Rate per sqft (₹)</Label>
        <Input
          type="number"
          placeholder="Enter rate"
          value={postformingRate}
          onChange={(e) => setPostformingRate(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-emerald-600 text-white shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Interior Cost Estimator</h1>
                <p className="text-emerald-100 text-sm">Calculate your kitchen & living room costs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 relative"
                onClick={() => setSavedDialogOpen(true)}
                title="Saved Estimates"
              >
                <FolderOpen className="w-5 h-5" />
                {hasUnsavedChanges && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-emerald-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
            {grandTotal > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-white/15 rounded-lg px-4 py-2">
                <IndianRupee className="w-4 h-4" />
                <span className="text-lg font-bold">{formatINR(grandTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Client Information */}
        <Card>
          <CardHeader className="bg-emerald-50 border-b border-emerald-100">
            <CardTitle className="text-emerald-800">Client Information</CardTitle>
            <CardDescription>Enter client details for the estimate</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input
                  placeholder="Full name"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Street / Area"
                  value={clientInfo.address}
                  onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input
                  type="tel"
                  placeholder="Mobile number"
                  value={clientInfo.contact}
                  onChange={(e) => setClientInfo({ ...clientInfo, contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Select
                  value={clientInfo.serviceType}
                  onValueChange={(value: ServiceType) => setClientInfo({ ...clientInfo, serviceType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kitchen Only">Kitchen Only</SelectItem>
                    <SelectItem value="Full Interior">Full Interior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Type Selection */}
        {clientInfo.serviceType && (
          <Card>
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <CardTitle className="text-blue-800">Kitchen Configuration</CardTitle>
              <CardDescription>Select the kitchen modular type</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="max-w-sm space-y-2">
                <Label>Kitchen Type *</Label>
                <Select value={kitchenType} onValueChange={handleKitchenTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semi-Modular">Semi-Modular</SelectItem>
                    <SelectItem value="Full-Modular">Full-Modular</SelectItem>
                  </SelectContent>
                </Select>
                {kitchenType && (
                  <p className="text-sm text-muted-foreground">
                    Configured for <span className="font-semibold text-foreground">{kitchenType}</span> kitchen
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kitchen Components */}
        {(clientInfo.serviceType === 'Kitchen Only' || clientInfo.serviceType === 'Full Interior') && kitchenType && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Kitchen Components</h2>
                <span className="text-sm text-muted-foreground">Define dimensions, finishes, and quantities</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={resetKitchenComponents}>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Component 1: Structure / Countertop or Ply Verticals */}
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-amber-800 text-base">
                      {kitchenType === 'Semi-Modular' ? 'Ply Verticals' : 'Structure / Countertop'}
                    </CardTitle>
                    <span className="text-sm font-semibold text-amber-700">
                      ₹{calculateComponentTotal('component1').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {kitchenType === 'Semi-Modular' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quantity</Label>
                        <Input type="number" placeholder="0" value={estimate.components.component1.quantity} onChange={(e) => updateComponent('component1', 'quantity', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Rate / Unit</Label>
                        <Input value={formatINR(prices.plyVerticals)} disabled className="bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Material</Label>
                        <Select value={estimate.components.component1.material} onValueChange={(value) => updateComponent('component1', 'material', value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(prices.countertopMaterial).map(([mat, rate]) => (
                              <SelectItem key={mat} value={mat}>{mat} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Height (mm)</Label>
                        <Input type="number" placeholder="0" value={estimate.components.component1.height} onChange={(e) => updateComponent('component1', 'height', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Width (mm)</Label>
                        <Input type="number" placeholder="0" value={estimate.components.component1.width} onChange={(e) => updateComponent('component1', 'width', e.target.value)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tandem Drawers */}
              <Card className="bg-sky-50 border-sky-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sky-800 text-base">Tandem Drawers</CardTitle>
                    <span className="text-sm font-semibold text-sky-700">
                      ₹{calculateComponentTotal('tandemDrawers').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Brand</Label>
                      <Select value={estimate.components.tandemDrawers.brand} onValueChange={(value) => updateComponent('tandemDrawers', 'brand', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.tandemDrawers).map(([brand, rate]) => (
                            <SelectItem key={brand} value={brand}>{brand} (₹{rate.toLocaleString('en-IN')})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="0" value={estimate.components.tandemDrawers.quantity} onChange={(e) => updateComponent('tandemDrawers', 'quantity', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / Unit</Label>
                      <Input value={estimate.components.tandemDrawers.brand ? formatINR(prices.tandemDrawers[estimate.components.tandemDrawers.brand as Brand]) : ''} disabled className="bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dustbin + BTD */}
              <Card className="bg-rose-50 border-rose-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-rose-800 text-base">Dustbin + BTD</CardTitle>
                    <span className="text-sm font-semibold text-rose-700">
                      ₹{calculateComponentTotal('dustbinBTD').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Brand</Label>
                      <Select value={estimate.components.dustbinBTD.brand} onValueChange={(value) => updateComponent('dustbinBTD', 'brand', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.dustbinBTD).map(([brand, rate]) => (
                            <SelectItem key={brand} value={brand}>{brand} (₹{rate.toLocaleString('en-IN')})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="0" value={estimate.components.dustbinBTD.quantity} onChange={(e) => updateComponent('dustbinBTD', 'quantity', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / Unit</Label>
                      <Input value={estimate.components.dustbinBTD.brand ? formatINR(prices.dustbinBTD[estimate.components.dustbinBTD.brand as Brand]) : ''} disabled className="bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bottle Pullout */}
              <Card className="bg-violet-50 border-violet-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-violet-800 text-base">Bottle Pullout</CardTitle>
                    <span className="text-sm font-semibold text-violet-700">
                      ₹{calculateComponentTotal('bottlePullout').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Brand</Label>
                      <Select value={estimate.components.bottlePullout.brand} onValueChange={(value) => updateComponent('bottlePullout', 'brand', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.bottlePullout).map(([brand, rate]) => (
                            <SelectItem key={brand} value={brand}>{brand} (₹{rate.toLocaleString('en-IN')})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="0" value={estimate.components.bottlePullout.quantity} onChange={(e) => updateComponent('bottlePullout', 'quantity', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / Unit</Label>
                      <Input value={estimate.components.bottlePullout.brand ? formatINR(prices.bottlePullout[estimate.components.bottlePullout.brand as Brand]) : ''} disabled className="bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wicker Basket */}
              <Card className="bg-orange-50 border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-orange-800 text-base">Wicker Basket</CardTitle>
                    <span className="text-sm font-semibold text-orange-700">
                      ₹{calculateComponentTotal('wickerBasket').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Brand</Label>
                      <Select value={estimate.components.wickerBasket.brand} onValueChange={(value) => updateComponent('wickerBasket', 'brand', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.wickerBasket).map(([brand, rate]) => (
                            <SelectItem key={brand} value={brand}>{brand} (₹{rate.toLocaleString('en-IN')})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="0" value={estimate.components.wickerBasket.quantity} onChange={(e) => updateComponent('wickerBasket', 'quantity', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / Unit</Label>
                      <Input value={estimate.components.wickerBasket.brand ? formatINR(prices.wickerBasket[estimate.components.wickerBasket.brand as Brand]) : ''} disabled className="bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tall Unit */}
              <Card className="bg-teal-50 border-teal-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-teal-800 text-base">Tall Unit</CardTitle>
                    <span className="text-sm font-semibold text-teal-700">
                      ₹{calculateComponentTotal('tallUnit').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.tallUnit.height} onChange={(e) => updateComponent('tallUnit', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.tallUnit.width} onChange={(e) => updateComponent('tallUnit', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Depth</Label>
                      <Select value={estimate.components.tallUnit.depth || '450mm'} onValueChange={(value) => { updateComponent('tallUnit', 'depth', value); updateComponent('tallUnit', 'tallPantryFinish', '') }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="450mm">450mm</SelectItem>
                          <SelectItem value="600mm">600mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Finish</Label>
                      <Select value={estimate.components.tallUnit.tallPantryFinish} onValueChange={(value) => updateComponent('tallUnit', 'tallPantryFinish', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.tallUnitFinishByDepth[estimate.components.tallUnit.depth || '450mm'] || {}).map(([finish, rate]) => (
                            <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                          ))}
                          <SelectItem value="Postforming">Postforming</SelectItem>
                        </SelectContent>
                      </Select>
                      <PostformingRateInput selectedFinish={estimate.components.tallUnit.tallPantryFinish} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="0" value={estimate.components.tallUnit.quantity} onChange={(e) => updateComponent('tallUnit', 'quantity', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pantry Unit */}
              <Card className="bg-cyan-50 border-cyan-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-cyan-800 text-base">Pantry Unit</CardTitle>
                    <span className="text-sm font-semibold text-cyan-700">
                      ₹{calculateComponentTotal('pantryUnit').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.pantryUnit.height} onChange={(e) => updateComponent('pantryUnit', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.pantryUnit.width} onChange={(e) => updateComponent('pantryUnit', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Finish</Label>
                      <Select value={estimate.components.pantryUnit.tallPantryFinish} onValueChange={(value) => updateComponent('pantryUnit', 'tallPantryFinish', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.tallPantryFinish).map(([finish, rate]) => (
                            <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                          ))}
                          <SelectItem value="Postforming">Postforming</SelectItem>
                        </SelectContent>
                      </Select>
                      <PostformingRateInput selectedFinish={estimate.components.pantryUnit.tallPantryFinish} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Accessories</Label>
                      <Select value={estimate.components.pantryUnit.accessories} onValueChange={(value) => updateComponent('pantryUnit', 'accessories', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.pantryAccessories).map(([acc, rate]) => (
                            <SelectItem key={acc} value={acc}>{acc === 'Openable (6+6 basket)' ? 'Openable 6+6' : acc} (₹{rate.toLocaleString('en-IN')})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Base Carcase */}
              <Card className="bg-stone-50 border-stone-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-stone-800 text-base">Base Carcase</CardTitle>
                    <span className="text-sm font-semibold text-stone-700">
                      ₹{calculateComponentTotal('baseCarcase').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.baseCarcase.height} onChange={(e) => updateComponent('baseCarcase', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.baseCarcase.width} onChange={(e) => updateComponent('baseCarcase', 'width', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / sqft</Label>
                      <Input value={formatINR(prices.baseCarcase)} disabled className="bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kitchen Paneling */}
              <Card className="bg-fuchsia-50 border-fuchsia-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-fuchsia-800 text-base">Kitchen Paneling</CardTitle>
                    <span className="text-sm font-semibold text-fuchsia-700">
                      ₹{calculateComponentTotal('kitchenPaneling').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.kitchenPaneling.height} onChange={(e) => updateComponent('kitchenPaneling', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.kitchenPaneling.width} onChange={(e) => updateComponent('kitchenPaneling', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">Finish</Label>
                    <Select value={estimate.components.kitchenPaneling.tallPantryFinish} onValueChange={(value) => updateComponent('kitchenPaneling', 'tallPantryFinish', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.kitchenPaneling).map(([finish, rate]) => (
                          <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                        ))}
                        <SelectItem value="Postforming">Postforming</SelectItem>
                      </SelectContent>
                    </Select>
                    <PostformingRateInput selectedFinish={estimate.components.kitchenPaneling.tallPantryFinish} />
                  </div>
                </CardContent>
              </Card>

              {/* Overhead Cabinet */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-green-800 text-base">Overhead Cabinet</CardTitle>
                    <span className="text-sm font-semibold text-green-700">
                      ₹{calculateComponentTotal('overheadCabinet').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.overheadCabinet.height} onChange={(e) => updateComponent('overheadCabinet', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.overheadCabinet.width} onChange={(e) => updateComponent('overheadCabinet', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Finish</Label>
                      <Select value={estimate.components.overheadCabinet.overheadCabinetFinish} onValueChange={(value) => updateComponent('overheadCabinet', 'overheadCabinetFinish', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.overheadCabinetFinish).map(([finish, rate]) => (
                            <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                          ))}
                          <SelectItem value="Postforming">Postforming</SelectItem>
                        </SelectContent>
                      </Select>
                      <PostformingRateInput selectedFinish={estimate.components.overheadCabinet.overheadCabinetFinish} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / sqft</Label>
                      <Input
                        value={estimate.components.overheadCabinet.overheadCabinetFinish ? formatINR(prices.overheadCabinetFinish[estimate.components.overheadCabinet.overheadCabinetFinish as OverheadCabinetFinishType]) : ''}
                        disabled
                        className="bg-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overhead Loft */}
              <Card className="bg-indigo-50 border-indigo-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-indigo-800 text-base">Overhead Loft</CardTitle>
                    <span className="text-sm font-semibold text-indigo-700">
                      ₹{calculateComponentTotal('overheadLoft').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Loft Type</Label>
                      <Select value={estimate.components.overheadLoft.loftType} onValueChange={(value) => { updateComponent('overheadLoft', 'loftType', value); updateComponent('overheadLoft', 'finish', ''); updateComponent('overheadLoft', 'depth', '') }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(prices.overheadLoft).map(([type, rate]) => (
                            <SelectItem key={type} value={type}>{type} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {estimate.components.overheadLoft.loftType === 'Box Loft' ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Depth</Label>
                          <Select value={estimate.components.overheadLoft.depth || '450mm'} onValueChange={(value) => { updateComponent('overheadLoft', 'depth', value); updateComponent('overheadLoft', 'finish', '') }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="450mm">450mm</SelectItem>
                              <SelectItem value="600mm">600mm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Finish</Label>
                          <Select value={estimate.components.overheadLoft.finish} onValueChange={(value) => updateComponent('overheadLoft', 'finish', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(prices.overheadBoxLoftFinish[estimate.components.overheadLoft.depth || '450mm'] || {}).map(([finish, rate]) => (
                                <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                              ))}
                              <SelectItem value="Postforming">Postforming</SelectItem>
                            </SelectContent>
                          </Select>
                          <PostformingRateInput selectedFinish={estimate.components.overheadLoft.finish} />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Finish</Label>
                        <Select value={estimate.components.overheadLoft.finish} onValueChange={(value) => updateComponent('overheadLoft', 'finish', value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(prices.overheadFinish).map(([finish, rate]) => (
                              <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                            ))}
                            <SelectItem value="Postforming">Postforming</SelectItem>
                          </SelectContent>
                        </Select>
                        <PostformingRateInput selectedFinish={estimate.components.overheadLoft.finish} />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.overheadLoft.height} onChange={(e) => updateComponent('overheadLoft', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.overheadLoft.width} onChange={(e) => updateComponent('overheadLoft', 'width', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Shutter with Glass */}
              <Card className="bg-fuchsia-50 border-fuchsia-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-fuchsia-800 text-base">Profile Shutter with Glass</CardTitle>
                    <span className="text-sm font-semibold text-fuchsia-700">
                      {formatINR(calculateComponentTotal('profileShutter'))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.profileShutter.height} onChange={(e) => updateComponent('profileShutter', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.profileShutter.width} onChange={(e) => updateComponent('profileShutter', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Glass Finish</Label>
                    <Select value={estimate.components.profileShutter.tallPantryFinish} onValueChange={(value) => updateComponent('profileShutter', 'tallPantryFinish', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select glass type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.profileShutterGlass).map(([glass, rate]) => (
                          <SelectItem key={glass} value={glass}>{glass} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rate / sqft</Label>
                    <Input value={estimate.components.profileShutter.tallPantryFinish ? (prices.profileShutterGlass[estimate.components.profileShutter.tallPantryFinish as ProfileShutterGlassType] || 0).toLocaleString('en-IN') : ''} disabled className="bg-white" />
                  </div>
                  {calculateComponentTotal('profileShutter') > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-fuchsia-100">
                      <span>{Math.round(calculateSqft(estimate.components.profileShutter.height, estimate.components.profileShutter.width))} sqft × ₹{prices.profileShutterGlass[estimate.components.profileShutter.tallPantryFinish as ProfileShutterGlassType]}/sqft</span>
                      <span className="font-semibold text-fuchsia-700">{formatINR(calculateComponentTotal('profileShutter'))}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Magic Corner */}
              <Card className="bg-sky-50 border-sky-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sky-800 text-base">Magic Corner</CardTitle>
                    <span className="text-sm font-semibold text-sky-700">
                      {formatINR(calculateComponentTotal('magicCorner'))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={estimate.components.magicCorner.brand} onValueChange={(value) => updateComponent('magicCorner', 'brand', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.magicCorner).map(([type, rate]) => (
                          <SelectItem key={type} value={type}>{type} — Olive ₹{rate.toLocaleString('en-IN')}/piece</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fixed Price</Label>
                    <Input value={estimate.components.magicCorner.brand ? formatINR(prices.magicCorner[estimate.components.magicCorner.brand as MagicCornerType] || 0) : ''} disabled className="bg-white" />
                  </div>
                </CardContent>
              </Card>

              {/* Rolling Shutter */}
              <Card className="bg-indigo-50 border-indigo-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-indigo-800 text-base">Rolling Shutter</CardTitle>
                    <span className="text-sm font-semibold text-indigo-700">
                      {formatINR(calculateComponentTotal('rollingShutter'))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={estimate.components.rollingShutter.brand} onValueChange={(value) => updateComponent('rollingShutter', 'brand', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.rollingShutter).map(([type, rate]) => (
                          <SelectItem key={type} value={type}>{type} — ₹{rate.toLocaleString('en-IN')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fixed Price</Label>
                    <Input value={estimate.components.rollingShutter.brand ? formatINR(prices.rollingShutter[estimate.components.rollingShutter.brand as RollingShutterType] || 0) : ''} disabled className="bg-white" />
                  </div>
                </CardContent>
              </Card>

              {/* Vanity Closing */}
              <Card className="bg-rose-50 border-rose-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-rose-800 text-base">Vanity Closing</CardTitle>
                    <span className="text-sm font-semibold text-rose-700">
                      {formatINR(calculateComponentTotal('vanityClosing'))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.vanityClosing.height} onChange={(e) => updateComponent('vanityClosing', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.vanityClosing.width} onChange={(e) => updateComponent('vanityClosing', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={estimate.components.vanityClosing.material} onValueChange={(value) => {
                      updateComponent('vanityClosing', 'material', value)
                      updateComponent('vanityClosing', 'tallPantryFinish', '')
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Frame">Frame</SelectItem>
                        <SelectItem value="Carcase">Carcase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Finish</Label>
                    <Select value={estimate.components.vanityClosing.tallPantryFinish} onValueChange={(value) => updateComponent('vanityClosing', 'tallPantryFinish', value)} disabled={!estimate.components.vanityClosing.material}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={estimate.components.vanityClosing.material ? 'Select finish' : 'Select type first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {estimate.components.vanityClosing.material && Object.entries(prices.vanityClosing[estimate.components.vanityClosing.material as VanityClosingType] || {}).map(([finish, rate]) => (
                          <SelectItem key={finish} value={finish}>{finish} — ₹{Number(rate).toLocaleString('en-IN')}/sqft</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rate (₹/sqft)</Label>
                    <Input value={estimate.components.vanityClosing.material && estimate.components.vanityClosing.tallPantryFinish ? (prices.vanityClosing[estimate.components.vanityClosing.material as VanityClosingType]?.[estimate.components.vanityClosing.tallPantryFinish as VanityClosingFinishType] || 0).toLocaleString('en-IN') : ''} disabled className="bg-white" />
                  </div>
                  {calculateComponentTotal('vanityClosing') > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-rose-200">
                      <span className="text-xs text-muted-foreground">
                        {Math.round(calculateSqft(estimate.components.vanityClosing.height, estimate.components.vanityClosing.width))} sqft × ₹{prices.vanityClosing[estimate.components.vanityClosing.material as VanityClosingType]?.[estimate.components.vanityClosing.tallPantryFinish as VanityClosingFinishType]}/sqft
                      </span>
                      <span className="font-semibold text-fuchsia-700">{formatINR(calculateComponentTotal('vanityClosing'))}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Handles */}
              <Card className="bg-lime-50 border-lime-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lime-800 text-base">Handles</CardTitle>
                    <span className="text-sm font-semibold text-lime-700">
                      {formatINR(calculateComponentTotal('handles'))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Handle Type</Label>
                      <Select value={estimate.components.handles.handleType} onValueChange={(value) => updateComponent('handles', 'handleType', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TopEdge">TopEdge</SelectItem>
                          <SelectItem value="G Profile">G Profile</SelectItem>
                          <SelectItem value="J Profile">J Profile</SelectItem>
                          <SelectItem value="Regular Handle">Regular Handle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Running Ft</Label>
                      <Input type="number" placeholder="0" value={estimate.components.handles.runningFeet} onChange={(e) => updateComponent('handles', 'runningFeet', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price / Rft (₹)</Label>
                      <Input type="number" placeholder="0" value={estimate.components.handles.handlePrice} onChange={(e) => updateComponent('handles', 'handlePrice', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Kitchen Custom Components */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Custom Components</h3>
                <Button variant="outline" size="sm" className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => addCustomComponent(setKitchenCustomComponents)}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Component
                </Button>
              </div>
              {kitchenCustomComponents.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {kitchenCustomComponents.map(comp => (
                    <Card key={comp.id} className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            placeholder="Component name"
                            value={comp.name}
                            onChange={(e) => updateCustomComponent(setKitchenCustomComponents, comp.id, 'name', e.target.value)}
                            className="text-amber-800 font-medium border-amber-200 bg-white h-8 text-sm max-w-[200px]"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-amber-700">
                              {formatINR(calculateCustomComponentCost(comp))}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeCustomComponent(setKitchenCustomComponents, comp.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Height (mm)</Label>
                            <Input type="number" placeholder="0" value={comp.height} onChange={(e) => updateCustomComponent(setKitchenCustomComponents, comp.id, 'height', e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Width (mm)</Label>
                            <Input type="number" placeholder="0" value={comp.width} onChange={(e) => updateCustomComponent(setKitchenCustomComponents, comp.id, 'width', e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Finish</Label>
                            <Select value={comp.finish} onValueChange={(value) => updateCustomComponent(setKitchenCustomComponents, comp.id, 'finish', value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SF">SF</SelectItem>
                                <SelectItem value="HGL">HGL</SelectItem>
                                <SelectItem value="Acrylic">Acrylic</SelectItem>
                                <SelectItem value="Glass Acrylic">Glass Acrylic</SelectItem>
                                <SelectItem value="Postforming">Postforming</SelectItem>
                              </SelectContent>
                            </Select>
                            <PostformingRateInput selectedFinish={comp.finish} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Rate (₹/sqft)</Label>
                            <Input type="number" placeholder="0" value={comp.rate} onChange={(e) => updateCustomComponent(setKitchenCustomComponents, comp.id, 'rate', e.target.value)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Kitchen Summary */}
            <Card>
              <CardHeader className="bg-emerald-50 border-b border-emerald-100">
                <CardTitle className="text-emerald-800">Kitchen Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Component</TableHead>
                      <TableHead className="text-right font-semibold">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(estimate.components).map((key) => {
                      const componentKey = key as keyof KitchenEstimate['components']
                      const total = calculateComponentTotal(componentKey)
                      if (total > 0) {
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{getComponentLabel(componentKey)}</TableCell>
                            <TableCell className="text-right font-semibold">{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          </TableRow>
                        )
                      }
                      return null
                    })}
                    {kitchenCustomComponents.map(comp => {
                      const cost = calculateCustomComponentCost(comp)
                      if (cost > 0) {
                        return (
                          <TableRow key={comp.id}>
                            <TableCell className="font-medium">{comp.name || 'Custom Component'}</TableCell>
                            <TableCell className="text-right font-semibold">{cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          </TableRow>
                        )
                      }
                      return null
                    })}
                    <TableRow className="bg-emerald-50 hover:bg-emerald-50 font-bold">
                      <TableCell className="font-bold text-emerald-900">Kitchen Total</TableCell>
                      <TableCell className="text-right font-bold text-emerald-900">{totalEstimatedCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Living Room Components */}
        {clientInfo.serviceType === 'Full Interior' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Living Room — TV Unit</h2>
                <span className="text-sm text-muted-foreground">Define living room module specifications</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={resetLivingRoomComponents}>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Chest of Drawers */}
              <Card className="bg-pink-50 border-pink-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-pink-800 text-base">Chest of Drawers</CardTitle>
                    <span className="text-sm font-semibold text-pink-700">
                      ₹{calculateLivingRoomComponentTotal('chestOfDrawers').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.chestOfDrawers.height} onChange={(e) => updateLivingRoomComponent('chestOfDrawers', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.chestOfDrawers.width} onChange={(e) => updateLivingRoomComponent('chestOfDrawers', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">Finish</Label>
                    <Select value={livingRoomEstimate.components.chestOfDrawers.tallPantryFinish} onValueChange={(value) => updateLivingRoomComponent('chestOfDrawers', 'tallPantryFinish', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.livingRoomFinish).map(([finish, rate]) => (
                          <SelectItem key={finish} value={finish}>{finish === 'Veneer with polish' ? 'Veneer' : finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                        ))}
                        <SelectItem value="Postforming">Postforming</SelectItem>
                      </SelectContent>
                    </Select>
                    <PostformingRateInput selectedFinish={livingRoomEstimate.components.chestOfDrawers.tallPantryFinish} />
                  </div>
                </CardContent>
              </Card>

              {/* Base Cabinet with shutters */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-purple-800 text-base">Base Cabinet with Shutters</CardTitle>
                    <span className="text-sm font-semibold text-purple-700">
                      ₹{calculateLivingRoomComponentTotal('baseCabinet').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.baseCabinet.height} onChange={(e) => updateLivingRoomComponent('baseCabinet', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.baseCabinet.width} onChange={(e) => updateLivingRoomComponent('baseCabinet', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">Finish</Label>
                    <Select value={livingRoomEstimate.components.baseCabinet.tallPantryFinish} onValueChange={(value) => updateLivingRoomComponent('baseCabinet', 'tallPantryFinish', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.livingRoomFinish).map(([finish, rate]) => (
                          <SelectItem key={finish} value={finish}>{finish === 'Veneer with polish' ? 'Veneer' : finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                        ))}
                        <SelectItem value="Postforming">Postforming</SelectItem>
                      </SelectContent>
                    </Select>
                    <PostformingRateInput selectedFinish={livingRoomEstimate.components.baseCabinet.tallPantryFinish} />
                  </div>
                </CardContent>
              </Card>

              {/* Living Room Tall Unit */}
              <Card className="bg-sky-50 border-sky-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sky-800 text-base">Tall Unit</CardTitle>
                    <span className="text-sm font-semibold text-sky-700">
                      ₹{calculateLivingRoomComponentTotal('livingRoomTallUnit').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.livingRoomTallUnit.height} onChange={(e) => updateLivingRoomComponent('livingRoomTallUnit', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.livingRoomTallUnit.width} onChange={(e) => updateLivingRoomComponent('livingRoomTallUnit', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">Finish</Label>
                    <Select value={livingRoomEstimate.components.livingRoomTallUnit.tallPantryFinish} onValueChange={(value) => updateLivingRoomComponent('livingRoomTallUnit', 'tallPantryFinish', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.livingRoomTallUnitFinish).map(([finish, rate]) => (
                          <SelectItem key={finish} value={finish}>{finish === 'Veneer with polish' ? 'Veneer' : finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                        ))}
                        <SelectItem value="Postforming">Postforming</SelectItem>
                      </SelectContent>
                    </Select>
                    <PostformingRateInput selectedFinish={livingRoomEstimate.components.livingRoomTallUnit.tallPantryFinish} />
                  </div>
                </CardContent>
              </Card>

              {/* Back Panel */}
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-amber-800 text-base">Back Panel</CardTitle>
                    <span className="text-sm font-semibold text-amber-700">
                      ₹{calculateLivingRoomComponentTotal('backPanel').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.backPanel.height} onChange={(e) => updateLivingRoomComponent('backPanel', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.backPanel.width} onChange={(e) => updateLivingRoomComponent('backPanel', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">Finish</Label>
                    <Select value={livingRoomEstimate.components.backPanel.loftType} onValueChange={(value) => updateLivingRoomComponent('backPanel', 'loftType', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.backPanelFinish).map(([finish, rate]) => (
                          <SelectItem key={finish} value={finish}>{finish === 'Veneer' ? 'Veneer' : finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                        ))}
                        <SelectItem value="Postforming">Postforming</SelectItem>
                      </SelectContent>
                    </Select>
                    <PostformingRateInput selectedFinish={livingRoomEstimate.components.backPanel.loftType} />
                  </div>
                </CardContent>
              </Card>

              {/* Ledge/Shelf */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-green-800 text-base">Ledge / Shelf</CardTitle>
                    <span className="text-sm font-semibold text-green-700">
                      ₹{calculateLivingRoomComponentTotal('ledgeShelf').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.ledgeShelf.height} onChange={(e) => updateLivingRoomComponent('ledgeShelf', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.ledgeShelf.width} onChange={(e) => updateLivingRoomComponent('ledgeShelf', 'width', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.ledgeShelf.quantity} onChange={(e) => updateLivingRoomComponent('ledgeShelf', 'quantity', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fluted Panel */}
              <Card className="bg-teal-50 border-teal-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-teal-800 text-base">Fluted Panel</CardTitle>
                    <span className="text-sm font-semibold text-teal-700">
                      ₹{calculateLivingRoomComponentTotal('flutedPanel').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity (pieces)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.flutedPanel.quantity} onChange={(e) => updateLivingRoomComponent('flutedPanel', 'quantity', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / Piece</Label>
                      <Input value="₹900" disabled className="bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shoe Rack */}
              <Card className="bg-rose-50 border-rose-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-rose-800 text-base">Shoe Rack</CardTitle>
                    <span className="text-sm font-semibold text-rose-700">
                      ₹{calculateLivingRoomComponentTotal('shoeRack').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.shoeRack.height} onChange={(e) => updateLivingRoomComponent('shoeRack', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.shoeRack.width} onChange={(e) => updateLivingRoomComponent('shoeRack', 'width', e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs">Finish</Label>
                    <Select value={livingRoomEstimate.components.shoeRack.tallPantryFinish} onValueChange={(value) => updateLivingRoomComponent('shoeRack', 'tallPantryFinish', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(prices.livingRoomFinish).map(([finish, rate]) => (
                          <SelectItem key={finish} value={finish}>{finish === 'Veneer with polish' ? 'Veneer' : finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Sitting with Cushion */}
              <Card className="bg-orange-50 border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-orange-800 text-base">Sitting with Cushion</CardTitle>
                    <span className="text-sm font-semibold text-orange-700">
                      ₹{calculateLivingRoomComponentTotal('sittingWithCushion').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.sittingWithCushion.height} onChange={(e) => updateLivingRoomComponent('sittingWithCushion', 'height', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" placeholder="0" value={livingRoomEstimate.components.sittingWithCushion.width} onChange={(e) => updateLivingRoomComponent('sittingWithCushion', 'width', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate / sqft</Label>
                      <Input value={formatINR(prices.sittingWithCushion)} disabled className="bg-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Living Room Custom Components */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Custom Components</h3>
                <Button variant="outline" size="sm" className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => addCustomComponent(setLivingRoomCustomComponents)}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Component
                </Button>
              </div>
              {livingRoomCustomComponents.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {livingRoomCustomComponents.map(comp => (
                    <Card key={comp.id} className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            placeholder="Component name"
                            value={comp.name}
                            onChange={(e) => updateCustomComponent(setLivingRoomCustomComponents, comp.id, 'name', e.target.value)}
                            className="text-amber-800 font-medium border-amber-200 bg-white h-8 text-sm max-w-[200px]"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-amber-700">
                              {formatINR(calculateCustomComponentCost(comp))}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeCustomComponent(setLivingRoomCustomComponents, comp.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Height (mm)</Label>
                            <Input type="number" placeholder="0" value={comp.height} onChange={(e) => updateCustomComponent(setLivingRoomCustomComponents, comp.id, 'height', e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Width (mm)</Label>
                            <Input type="number" placeholder="0" value={comp.width} onChange={(e) => updateCustomComponent(setLivingRoomCustomComponents, comp.id, 'width', e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Finish</Label>
                            <Select value={comp.finish} onValueChange={(value) => updateCustomComponent(setLivingRoomCustomComponents, comp.id, 'finish', value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SF">SF</SelectItem>
                                <SelectItem value="HGL">HGL</SelectItem>
                                <SelectItem value="Acrylic">Acrylic</SelectItem>
                                <SelectItem value="Veneer with polish">Veneer with polish</SelectItem>
                                <SelectItem value="Postforming">Postforming</SelectItem>
                              </SelectContent>
                            </Select>
                            <PostformingRateInput selectedFinish={comp.finish} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Rate (₹/sqft)</Label>
                            <Input type="number" placeholder="0" value={comp.rate} onChange={(e) => updateCustomComponent(setLivingRoomCustomComponents, comp.id, 'rate', e.target.value)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Living Room Summary */}
            <Card>
              <CardHeader className="bg-purple-50 border-b border-purple-100">
                <CardTitle className="text-purple-800">Living Room Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Component</TableHead>
                      <TableHead className="text-right font-semibold">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(livingRoomEstimate.components).map((key) => {
                      const componentKey = key as keyof LivingRoomEstimate['components']
                      const total = calculateLivingRoomComponentTotal(componentKey)
                      if (total > 0) {
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{getLivingRoomComponentLabel(componentKey)}</TableCell>
                            <TableCell className="text-right font-semibold">{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          </TableRow>
                        )
                      }
                      return null
                    })}
                    {livingRoomCustomComponents.map(comp => {
                      const cost = calculateCustomComponentCost(comp)
                      if (cost > 0) {
                        return (
                          <TableRow key={comp.id}>
                            <TableCell className="font-medium">{comp.name || 'Custom Component'}</TableCell>
                            <TableCell className="text-right font-semibold">{cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          </TableRow>
                        )
                      }
                      return null
                    })}
                    <TableRow className="bg-purple-50 hover:bg-purple-50 font-bold">
                      <TableCell className="font-bold text-purple-900">Living Room Total</TableCell>
                      <TableCell className="text-right font-bold text-purple-900">{totalLivingRoomCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bedroom Section */}
        {clientInfo.serviceType === 'Full Interior' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-pink-600" />
                <h2 className="text-lg font-semibold text-foreground">Bedroom Components</h2>
                <span className="text-sm text-muted-foreground">Configure each bedroom type independently</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={resetBedrooms}>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Bedrooms
              </Button>
            </div>

            <Tabs defaultValue="master" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {(Object.keys(bedroomCategoryLabels) as BedroomCategory[]).map((cat) => {
                  const catTotal = calculateBedroomCategoryTotal(cat)
                  return (
                    <TabsTrigger key={cat} value={cat} className="flex items-center gap-2">
                      {bedroomCategoryLabels[cat]}
                      {catTotal > 0 && (
                        <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-semibold">
                          {formatINR(catTotal)}
                        </span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {(Object.keys(bedroomCategoryLabels) as BedroomCategory[]).map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-4 space-y-4">
                  <BedroomTypeCards {...getBedroomCardsProps(cat)} />

                  {/* Bedroom Custom Components */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground">Custom Components</h3>
                      <Button variant="outline" size="sm" className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => addBedroomCustomComponent(cat)}>
                        <Plus className="w-3.5 h-3.5" />
                        Add Custom Component
                      </Button>
                    </div>
                    {bedroomCustomComponents[cat].length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {bedroomCustomComponents[cat].map(comp => (
                          <Card key={comp.id} className="bg-amber-50 border-amber-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between gap-2">
                                <Input
                                  placeholder="Component name"
                                  value={comp.name}
                                  onChange={(e) => updateBedroomCustomComponent(cat, comp.id, 'name', e.target.value)}
                                  className="text-amber-800 font-medium border-amber-200 bg-white h-8 text-sm max-w-[200px]"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm font-semibold text-amber-700">
                                    {formatINR(calculateCustomComponentCost(comp))}
                                  </span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeBedroomCustomComponent(cat, comp.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Height (mm)</Label>
                                  <Input type="number" placeholder="0" value={comp.height} onChange={(e) => updateBedroomCustomComponent(cat, comp.id, 'height', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Width (mm)</Label>
                                  <Input type="number" placeholder="0" value={comp.width} onChange={(e) => updateBedroomCustomComponent(cat, comp.id, 'width', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Finish</Label>
                                  <Select value={comp.finish} onValueChange={(value) => updateBedroomCustomComponent(cat, comp.id, 'finish', value)}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="SF">SF</SelectItem>
                                      <SelectItem value="HGL">HGL</SelectItem>
                                      <SelectItem value="Acrylic">Acrylic</SelectItem>
                                      <SelectItem value="Veneer with polish">Veneer with polish</SelectItem>
                                      <SelectItem value="Postforming">Postforming</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <PostformingRateInput selectedFinish={comp.finish} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Rate (₹/sqft)</Label>
                                  <Input type="number" placeholder="0" value={comp.rate} onChange={(e) => updateBedroomCustomComponent(cat, comp.id, 'rate', e.target.value)} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Bedroom Cost Breakdown */}
            <Card>
              <CardHeader className="bg-pink-50 border-b border-pink-100">
                <CardTitle className="text-pink-800">Bedroom Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Bedroom Type</TableHead>
                      <TableHead className="font-semibold">Component</TableHead>
                      <TableHead className="text-right font-semibold">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Object.keys(bedroomCategoryLabels) as BedroomCategory[]).map((cat) => {
                      const br = bedroomsEstimate[cat]
                      const catTotal = calculateSingleBedroomTotal(br)
                      if (catTotal <= 0) return null
                      const components: { name: string; total: number }[] = [
                        { name: 'Wardrobe', total: calculateWardrobeTotal(br) },
                        { name: 'Loft', total: calculateBedroomLoftTotal(br) },
                        { name: 'Window Seat with Storage', total: calculateWindowSeatTotal(br) },
                        { name: 'Study Table', total: calculateStudyTableTotal(br) },
                        { name: 'Dresser Unit', total: calculateDresserUnitTotal(br) },
                        { name: 'Bed', total: calculateBedTotal(br) },
                        { name: 'Head Board', total: calculateHeadBoardTotal(br) },
                      ].filter(c => c.total > 0)
                      return (
                        <Fragment key={cat}>
                          <TableRow className="bg-pink-50/50 hover:bg-pink-50/50 font-semibold">
                            <TableCell colSpan={2} className="text-pink-900">{bedroomCategoryLabels[cat]}</TableCell>
                            <TableCell className="text-right font-semibold text-pink-900">{catTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          </TableRow>
                          {components.map(c => (
                            <TableRow key={c.name}>
                              <TableCell />
                              <TableCell className="text-muted-foreground">{c.name}</TableCell>
                              <TableCell className="text-right">{c.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                            </TableRow>
                          ))}
                          {bedroomCustomComponents[cat].map(comp => {
                            const cost = calculateCustomComponentCost(comp)
                            if (cost > 0) {
                              return (
                                <TableRow key={comp.id}>
                                  <TableCell />
                                  <TableCell className="text-muted-foreground">{comp.name || 'Custom Component'}</TableCell>
                                  <TableCell className="text-right">{cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                                </TableRow>
                              )
                            }
                            return null
                          })}
                        </Fragment>
                      )
                    })}
                    {totalBedroomCost > 0 && (
                      <TableRow className="bg-pink-100 hover:bg-pink-100 font-bold">
                        <TableCell colSpan={2} className="font-bold text-pink-900">Bedroom Total</TableCell>
                        <TableCell className="text-right font-bold text-pink-900">{totalBedroomCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Miscellaneous Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-foreground">Miscellaneous</h2>
          </div>

          {/* False Ceiling */}
          <Card className="border-orange-200">
            <CardHeader className="pb-3 bg-orange-50 border-b border-orange-100">
              <CardTitle className="text-sm font-medium text-orange-800">False Ceiling</CardTitle>
              <CardDescription className="text-xs text-orange-600">Area (mm) × Material rate per sq.ft</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type of Ceiling</Label>
                  <Select
                    value={miscEstimate.falseCeiling.type}
                    onValueChange={(v) => updateMisc('type', v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plain Ceiling">Plain Ceiling</SelectItem>
                      <SelectItem value="Peripheral Ceiling">Peripheral Ceiling</SelectItem>
                      <SelectItem value="Two Layer Ceiling">Two Layer Ceiling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Material</Label>
                  <Select
                    value={miscEstimate.falseCeiling.material}
                    onValueChange={(v) => updateMisc('material', v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gypsum">Gypsum — ₹105/sqft</SelectItem>
                      <SelectItem value="Acrylic">Acrylic — ₹160/sqft</SelectItem>
                      <SelectItem value="ACP">ACP — ₹180/sqft</SelectItem>
                      <SelectItem value="Armstrong">Armstrong — ₹115/sqft</SelectItem>
                      <SelectItem value="Glass">Glass — ₹350/sqft</SelectItem>
                      <SelectItem value="PVC">PVC — ₹125/sqft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Length (mm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={miscEstimate.falseCeiling.height}
                    onChange={(e) => updateMisc('height', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Width (mm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={miscEstimate.falseCeiling.width}
                    onChange={(e) => updateMisc('width', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                <span className="text-xs text-muted-foreground">
                  {calculateSqft(miscEstimate.falseCeiling.height, miscEstimate.falseCeiling.width).toFixed(2)} sqft
                  {miscEstimate.falseCeiling.material ? ` × ₹${MISC_PRICES.ceilingMaterial[miscEstimate.falseCeiling.material as CeilingMaterial]}/sqft` : ''}
                </span>
                <span className="text-sm font-bold text-orange-800">
                  {formatINR(falseCeilingCost)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Electrical Work */}
          <Card className="border-orange-200">
            <CardHeader className="pb-3 bg-orange-50 border-b border-orange-100">
              <CardTitle className="text-sm font-medium text-orange-800">Electrical Work</CardTitle>
              <CardDescription className="text-xs text-orange-600">Type of light / plug point × Quantity</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {miscEstimate.electricalWork.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No items added yet</p>
              )}
              {miscEstimate.electricalWork.map((item, idx) => {
                const itemRate = item.lightPointType ? (MISC_PRICES.lightPoint[item.lightPointType as LightPointType] || 0) : 0
                const itemQty = parseFloat(item.quantity) || 0
                const itemCost = itemRate * itemQty
                return (
                  <div key={item.id} className="rounded-lg border border-orange-100 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-orange-700">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeElectricalItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type of Light Point</Label>
                        <Select
                          value={item.lightPointType}
                          onValueChange={(v) => updateElectricalItem(item.id, 'lightPointType', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Primary Light Point">Primary Light Point — ₹750</SelectItem>
                            <SelectItem value="Secondary Light Point">Secondary Light Point — ₹450</SelectItem>
                            <SelectItem value="Half Plug Point">Half Plug Point — ₹400</SelectItem>
                            <SelectItem value="Full Plug Point">Full Plug Point — ₹700</SelectItem>
                            <SelectItem value="Concealed Light Fitting">Concealed Light Fitting — ₹150</SelectItem>
                            <SelectItem value="Fan Fitting">Fan Fitting — ₹150</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => updateElectricalItem(item.id, 'quantity', e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    {itemCost > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-orange-50">
                        <span>₹{itemRate}/unit × {itemQty} nos</span>
                        <span className="font-semibold text-orange-800">{formatINR(itemCost)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addElectricalItem}
                className="w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Item
              </Button>
              {electricalWorkCost > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                  <span className="text-xs font-medium text-orange-700">Total Electrical</span>
                  <span className="text-sm font-bold text-orange-800">{formatINR(electricalWorkCost)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Painting */}
          <Card className="border-orange-200">
            <CardHeader className="pb-3 bg-orange-50 border-b border-orange-100">
              <CardTitle className="text-sm font-medium text-orange-800">Painting</CardTitle>
              <CardDescription className="text-xs text-orange-600">Paint type rate × Total area in sq.ft</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {miscEstimate.painting.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No items added yet</p>
              )}
              {miscEstimate.painting.map((item, idx) => {
                const itemRate = item.paintType ? (MISC_PRICES.paint[item.paintType as PaintType] || 0) : 0
                const itemArea = parseFloat(item.totalArea) || 0
                const itemCost = itemRate * itemArea
                return (
                  <div key={item.id} className="rounded-lg border border-orange-100 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-orange-700">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removePaintingItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type of Paint</Label>
                        <Select
                          value={item.paintType}
                          onValueChange={(v) => updatePaintingItem(item.id, 'paintType', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select paint type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Luster Paint">Luster Paint — ₹38/sqft</SelectItem>
                            <SelectItem value="Texture Paint">Texture Paint — ₹115/sqft</SelectItem>
                            <SelectItem value="Plastic Paint">Plastic Paint — ₹33/sqft</SelectItem>
                            <SelectItem value="Distemper Paint">Distemper Paint — ₹27/sqft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Total Area (sq.ft)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.totalArea}
                          onChange={(e) => updatePaintingItem(item.id, 'totalArea', e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    {itemCost > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-orange-50">
                        <span>₹{itemRate}/sqft × {itemArea} sqft</span>
                        <span className="font-semibold text-orange-800">{formatINR(itemCost)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPaintingItem}
                className="w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Item
              </Button>
              {paintingCost > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                  <span className="text-xs font-medium text-orange-700">Total Painting</span>
                  <span className="text-sm font-bold text-orange-800">{formatINR(paintingCost)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {totalMiscellaneousCost > 0 && (
            <div className="flex justify-end px-2">
              <span className="text-sm font-semibold text-orange-800">
                Miscellaneous Total: {formatINR(totalMiscellaneousCost)}
              </span>
            </div>
          )}
        </div>

        {/* Estimate Summary & Export */}
        {((clientInfo.serviceType === 'Kitchen Only' && kitchenType) || (clientInfo.serviceType === 'Full Interior' && (kitchenType || totalLivingRoomCost > 0 || totalBedroomCost > 0))) && grandTotal > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-foreground">Estimate Summary & Export</h2>
            </div>

            {/* Logo Settings for Export */}
            <Card>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setLogoSettingsOpen(!logoSettingsOpen)}
              >
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Export Logo Settings
                    </CardTitle>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${logoSettingsOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <CardDescription>Adjust logo size and position in exported Excel</CardDescription>
                </CardHeader>
              </button>
              {logoSettingsOpen && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Width */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Logo Width (px)</Label>
                      <Input
                        type="number"
                        min={100}
                        max={600}
                        step={10}
                        value={logoSettings.width}
                        onChange={(e) => {
                          const v = Math.min(600, Math.max(100, Number(e.target.value) || 100))
                          setLogoSettings(s => ({ ...s, width: v }))
                        }}
                        className="h-10"
                      />
                    </div>
                    {/* Height */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Logo Height (px)</Label>
                      <Input
                        type="number"
                        min={40}
                        max={300}
                        step={10}
                        value={logoSettings.height}
                        onChange={(e) => {
                          const v = Math.min(300, Math.max(40, Number(e.target.value) || 40))
                          setLogoSettings(s => ({ ...s, height: v }))
                        }}
                        className="h-10"
                      />
                    </div>
                  </div>
                  {/* Position */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Logo Position</Label>
                    <Select
                      value={logoSettings.position}
                      onValueChange={(v) => setLogoSettings(s => ({ ...s, position: v as 'left' | 'center' | 'right' }))}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Discount Selector */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Percent className="w-5 h-5 text-amber-600" />
                    <Label className="text-sm font-medium">Discount</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select
                      value={String(selectedDiscount)}
                      onValueChange={(v) => setSelectedDiscount(Number(v))}
                    >
                      <SelectTrigger className="w-44 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Discount</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedDiscount > 0 && (
                      <span className="text-sm font-semibold text-red-600">- {formatINR(discountAmount)}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grand Total Banner */}
            <Card className="bg-emerald-600 border-emerald-600">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-emerald-100 text-sm">Total Estimated Cost</p>
                    {selectedDiscount > 0 && (
                      <p className="text-emerald-200 text-xs line-through">{formatINR(grandTotal)}</p>
                    )}
                    <p className="text-3xl font-bold text-white">{formatINR(discountedTotal)}</p>
                    {selectedDiscount > 0 && (
                      <p className="text-emerald-200 text-xs mt-0.5">Incl. {selectedDiscount}% discount</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleExportPDF} disabled={exporting} variant="secondary" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </Button>
                    <Button onClick={handleExportExcel} disabled={exporting} className="gap-2 bg-amber-500 hover:bg-amber-400 text-black">
                      <Download className="w-4 h-4" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consolidated Table */}
            <Card>
              <CardHeader className="bg-emerald-50 border-b border-emerald-100">
                <CardTitle className="text-emerald-800">Consolidated Estimate</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Section</TableHead>
                      <TableHead className="text-right font-semibold">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalEstimatedCost > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Kitchen — {kitchenType}</TableCell>
                        <TableCell className="text-right font-semibold">{totalEstimatedCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    )}
                    {clientInfo.serviceType === 'Full Interior' && totalLivingRoomCost > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Living Room — TV Unit</TableCell>
                        <TableCell className="text-right font-semibold">{totalLivingRoomCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    )}
                    {clientInfo.serviceType === 'Full Interior' && totalBedroomCost > 0 && (
                      <Fragment>
                        {(Object.keys(bedroomCategoryLabels) as BedroomCategory[]).map((cat) => {
                          const catTotal = calculateBedroomCategoryTotal(cat)
                          if (catTotal <= 0) return null
                          return (
                            <TableRow key={cat}>
                              <TableCell className="font-medium">{bedroomCategoryLabels[cat]}</TableCell>
                              <TableCell className="text-right font-semibold">{catTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                            </TableRow>
                          )
                        })}
                      </Fragment>
                    )}
                    {falseCeilingCost > 0 && (
                      <TableRow>
                        <TableCell className="font-medium text-orange-800">Misc — False Ceiling</TableCell>
                        <TableCell className="text-right font-semibold text-orange-800">{falseCeilingCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    )}
                    {miscEstimate.electricalWork.filter(i => i.lightPointType && parseFloat(i.quantity) > 0).map((item) => {
                      const rate = MISC_PRICES.lightPoint[item.lightPointType as LightPointType] || 0
                      const qty = parseFloat(item.quantity) || 0
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-orange-800">Misc — Electrical: {item.lightPointType} × {qty}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-800">{Math.round(rate * qty).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      )
                    })}
                    {miscEstimate.painting.filter(i => i.paintType && parseFloat(i.totalArea) > 0).map((item) => {
                      const rate = MISC_PRICES.paint[item.paintType as PaintType] || 0
                      const area = parseFloat(item.totalArea) || 0
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-orange-800">Misc — Painting: {item.paintType} × {area} sqft</TableCell>
                          <TableCell className="text-right font-semibold text-orange-800">{Math.round(rate * area).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      )
                    })}
                    {selectedDiscount > 0 && (
                      <TableRow className="bg-red-50 hover:bg-red-50">
                        <TableCell className="font-semibold text-red-700">Discount ({selectedDiscount}%)</TableCell>
                        <TableCell className="text-right font-semibold text-red-700">- {discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                      <TableCell className="font-bold text-emerald-900">Grand Total</TableCell>
                      <TableCell className="text-right font-bold text-emerald-900 text-lg">{discountedTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 mt-auto shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-sm text-muted-foreground">
          <p>Interior Cost Estimator &copy; {new Date().getFullYear()}</p>
          <p>All prices in INR (₹)</p>
        </div>
      </footer>

      <SavedEstimatesDialog
        open={savedDialogOpen}
        onOpenChange={setSavedDialogOpen}
        onSave={handleSaveEstimate}
        onLoad={handleLoadEstimate}
        onDelete={handleDeleteEstimate}
        hasUnsavedData={hasUnsavedChanges}
        currentTotal={grandTotal}
      />

      <RateSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultPrices={DEFAULT_PRICES}
        currentPrices={prices}
        onSave={handleSaveRates}
        onReset={handleResetRates}
      />
    </div>
  )
}