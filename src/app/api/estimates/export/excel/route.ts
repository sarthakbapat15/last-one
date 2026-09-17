import { NextRequest, NextResponse } from 'next/server'
import { Workbook } from 'exceljs'
import fs from 'fs'
import path from 'path'

// ── Types ──

interface EstimateData {
  clientInfo: { name: string; address: string; contact: string; serviceType: string }
  kitchenType: string
  totalCost: number
  kitchenCost: number
  livingRoomCost: number
  bedroomCost: number
  components: Record<string, any>
  livingRoomEstimate?: Record<string, any>
  bedroomsEstimate?: Record<string, any>
  kitchenCustomComponents?: Array<{ id: string; name: string; height: string; width: string; rate: string }>
  livingRoomCustomComponents?: Array<{ id: string; name: string; height: string; width: string; rate: string }>
  bedroomCustomComponents?: Record<string, Array<{ id: string; name: string; height: string; width: string; rate: string }>>
  logoSettings?: { width: number; height: number; position: 'left' | 'center' | 'right' }
  miscEstimate?: {
    falseCeiling: { type: string; material: string; height: string; width: string }
    electricalWork: Array<{ id?: string; lightPointType: string; quantity: string }>
    painting: Array<{ id?: string; paintType: string; totalArea: string }>
  }
  postformingRate?: string
  discountPercent?: number
}

interface ExportItem {
  label: string
  subLabel?: string
  l?: number
  b?: number
  sqft?: number
  quantity?: number
  totalSqft?: number
  rate?: number
  amount: number
}

// ── Validate ──

function validateData(body: any): EstimateData {
  return {
    clientInfo: {
      name: body?.clientInfo?.name || '',
      address: body?.clientInfo?.address || '',
      contact: body?.clientInfo?.contact || '',
      serviceType: body?.clientInfo?.serviceType || '',
    },
    kitchenType: body?.kitchenType || '',
    totalCost: body?.totalCost || 0,
    kitchenCost: body?.kitchenCost || 0,
    livingRoomCost: body?.livingRoomCost || 0,
    bedroomCost: body?.bedroomCost || 0,
    components: body?.components || {},
    livingRoomEstimate: body?.livingRoomEstimate || undefined,
    bedroomsEstimate: body?.bedroomsEstimate || undefined,
    kitchenCustomComponents: body?.kitchenCustomComponents || [],
    livingRoomCustomComponents: body?.livingRoomCustomComponents || [],
    bedroomCustomComponents: body?.bedroomCustomComponents || {},
    logoSettings: body?.logoSettings || { width: 350, height: 140, position: 'center' },
    miscEstimate: body?.miscEstimate || undefined,
    postformingRate: body?.postformingRate || '',
    discountPercent: body?.discountPercent || 0,
  }
}

// ── Price constants (mirrored from frontend) ──

const PRICES = {
  tandemDrawers: { Olive: 8000, Blum: 12000, Hettich: 12000 },
  dustbinBTD: { Olive: 7500, Blum: 7500, Hettich: 7500 },
  bottlePullout: { Olive: 8000, Blum: 8000, Hettich: 8000 },
  wickerBasket: { Olive: 7500, Hettich: 7500 },
  plyVerticals: 1500,
  overheadLoft: { 'Frame Loft': 1150, 'Box Loft': 1250 },
  overheadFinish: { SF: 1125, HGL: 1450, Acrylic: 1850, Laminate: 1200, PU: 1600 },
  tallPantryFinish: { SF: 1450, HGL: 1550, Acrylic: 1850, 'Glass Acrylic': 2150 },
  pantryAccessories: { Pullout: 21000, 'Openable (6+6 basket)': 40000 },
  livingRoomFinish: { SF: 1250, HGL: 1350, Acrylic: 1550, 'Veneer with polish': 1750 },
  livingRoomTallUnitFinish: { SF: 1250, HGL: 1350, Acrylic: 1850, 'Veneer with polish': 1750 },
  backPanelFinish: { HGL: 650, SF: 550, Acrylic: 1175, Veneer: 950 },
  ledgeShelf: 350,
  flutedPanel: 900,
  sittingWithCushion: 1350,
  profileShutter: 350,
  profileShutterGlass: { 'Clear Glass': 350, 'Fluted Glass': 450, 'Tinted Glass': 475, 'Frosted Glass': 525, 'Lacquered Glass': 750 },
  magicCorner: { 'Type 1': 28000, 'Type 2': 38000, 'Type 3': 54000 },
  rollingShutter: { PVC: 21000, Glass: 27000 },
  vanityClosing: {
    Frame: { SF: 1300, Gloss: 1400 },
    Carcase: { SF: 1800, Gloss: 1900 },
  },
  countertopMaterial: { Granite: 550, Quartz: 650 },
  baseCarcase: 1650,
  kitchenPaneling: { SF: 800, 'Gloss (MR+)': 1150, HGL: 1350, Acrylic: 1450 },
  overheadCabinetFinish: { SF: 1550, HGL: 2150, Acrylic: 2650, 'Glass Acrylic': 2850 },
  tallUnitFinishByDepth: {
    '450mm': { SF: 2100, HGL: 2450, 'MR+': 2350, Acrylic: 2900 },
    '600mm': { SF: 2125, 'MR+': 2375, HGL: 2500, Acrylic: 2950 },
  },
  overheadBoxLoftFinish: {
    '450mm': { SF: 1625, HGL: 1875 },
    '600mm': { SF: 1650, HGL: 2050 },
  },
  // Bedroom prices
  bedroomWardrobeFinish: { SF: 1550, HGL: 1650, Acrylic: 2150 },
  bedroomWardrobeSlidingMechanism: 15000,
  bedroomLoftFinish: {
    Frame: { SF: 1150, HGL: 1250, Acrylic: 1850 },
    Box: { SF: 1250, HGL: 1350, Acrylic: 1950 },
  },
  bedroomTallUnitFinish: { SF: 1250, HGL: 1350, Acrylic: 1850, 'Veneer with polish': 1750 },
  bedroomHeadBoardRates: { Laminated: 700, Cushioned: 850 },
  bedroomOpenBedPrice: 35000,
  bedroomHydraulicMechanismPrice: 25000,
}

// ── Helpers ──

const calculateSqft = (height: string, width: string): number => {
  const h = parseFloat(height) || 0
  const w = parseFloat(width) || 0
  return (h * w) / 92903
}

function getEffectiveRate(finish: string, rates: Record<string, number>): number {
  if (!finish) return 0
  if (finish === 'Postforming') return 0 // handled separately
  return rates[finish] || 0
}

function getPostformingRate(postformingRate: string): number {
  return parseFloat(postformingRate) || 0
}

// ── Kitchen Items ──

function getKitchenItems(components: any, kitchenType: string, postformingRate: string): ExportItem[] {
  const items: ExportItem[] = []
  const pRate = getPostformingRate(postformingRate)

  // Component 1: Ply Verticals or Structure/Countertop
  const c1 = components.component1 || {}
  if (kitchenType === 'Semi-Modular') {
    const qty = parseFloat(c1.quantity) || 0
    if (qty > 0) {
      items.push({ label: 'Ply Verticals', subLabel: 'CARCASE', quantity: qty, totalSqft: qty, rate: PRICES.plyVerticals, amount: qty * PRICES.plyVerticals })
    }
  } else {
    const sqft = calculateSqft(c1.height, c1.width)
    const basePrice = PRICES.countertopMaterial[c1.material as keyof typeof PRICES.countertopMaterial] || PRICES.countertopMaterial.Granite
    if (sqft > 0 && c1.height && c1.width) {
      items.push({ label: 'Structure / Countertop', subLabel: c1.material || 'Granite', l: parseFloat(c1.height) || 0, b: parseFloat(c1.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: basePrice, amount: sqft * basePrice })
    }
  }

  // Tandem Drawers
  const td = components.tandemDrawers || {}
  if (td.brand && PRICES.tandemDrawers[td.brand as keyof typeof PRICES.tandemDrawers]) {
    const qty = parseFloat(td.quantity) || 0
    const price = PRICES.tandemDrawers[td.brand as keyof typeof PRICES.tandemDrawers]
    if (qty > 0) items.push({ label: 'Tandem Drawers', subLabel: td.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  // Dustbin + BTD
  const db = components.dustbinBTD || {}
  if (db.brand && PRICES.dustbinBTD[db.brand as keyof typeof PRICES.dustbinBTD]) {
    const qty = parseFloat(db.quantity) || 0
    const price = PRICES.dustbinBTD[db.brand as keyof typeof PRICES.dustbinBTD]
    if (qty > 0) items.push({ label: 'Dustbin + BTD', subLabel: db.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  // Bottle Pullout
  const bp = components.bottlePullout || {}
  if (bp.brand && PRICES.bottlePullout[bp.brand as keyof typeof PRICES.bottlePullout]) {
    const qty = parseFloat(bp.quantity) || 0
    const price = PRICES.bottlePullout[bp.brand as keyof typeof PRICES.bottlePullout]
    if (qty > 0) items.push({ label: 'Bottle Pullout', subLabel: bp.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  // Wicker Basket
  const wb = components.wickerBasket || {}
  if (wb.brand && PRICES.wickerBasket[wb.brand as keyof typeof PRICES.wickerBasket]) {
    const qty = parseFloat(wb.quantity) || 0
    const price = PRICES.wickerBasket[wb.brand as keyof typeof PRICES.wickerBasket]
    if (qty > 0) items.push({ label: 'Wicker Baskets', subLabel: wb.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  // Tall Unit
  const tu = components.tallUnit || {}
  if (tu.height && tu.width && tu.tallPantryFinish) {
    const sqft = calculateSqft(tu.height, tu.width)
    const depth = (tu.depth || '450mm') as '450mm' | '600mm'
    let rate = 0
    if (tu.tallPantryFinish === 'Postforming') {
      rate = pRate
    } else {
      const depthPrices = PRICES.tallUnitFinishByDepth[depth]
      rate = depthPrices?.[tu.tallPantryFinish as keyof typeof depthPrices] || 0
    }
    if (sqft > 0 && rate > 0) {
      items.push({ label: 'Tall Unit', subLabel: `${depth} ${tu.tallPantryFinish}`, l: parseFloat(tu.height) || 0, b: parseFloat(tu.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
    }
  }

  // Pantry Unit
  const pu = components.pantryUnit || {}
  if (pu.height && pu.width && pu.tallPantryFinish) {
    const sqft = calculateSqft(pu.height, pu.width)
    const finishRate = PRICES.tallPantryFinish[pu.tallPantryFinish as keyof typeof PRICES.tallPantryFinish] || 0
    let amount = sqft * finishRate
    const accType = pu.accessories as string
    const accPrice = accType ? PRICES.pantryAccessories[accType as keyof typeof PRICES.pantryAccessories] : 0
    amount += accPrice || 0
    if (sqft > 0 && (finishRate > 0 || accPrice > 0)) {
      items.push({ label: 'Pantry Unit', subLabel: `Carcass ${pu.tallPantryFinish}`, l: parseFloat(pu.height) || 0, b: parseFloat(pu.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: finishRate, amount })
      if (accPrice > 0) {
        items.push({ label: '', subLabel: accType, quantity: 1, totalSqft: 1, rate: accPrice, amount: accPrice })
      }
    }
  }

  // Base Carcase
  const bcc = components.baseCarcase || {}
  if (bcc.height && bcc.width) {
    const sqft = calculateSqft(bcc.height, bcc.width)
    if (sqft > 0) {
      items.push({ label: 'Base Carcase', subLabel: 'CARCASE', l: parseFloat(bcc.height) || 0, b: parseFloat(bcc.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: PRICES.baseCarcase, amount: sqft * PRICES.baseCarcase })
    }
  }

  // Kitchen Paneling
  const kp = components.kitchenPaneling || {}
  if (kp.height && kp.width && kp.tallPantryFinish) {
    const sqft = calculateSqft(kp.height, kp.width)
    const kpRate = kp.tallPantryFinish === 'Postforming'
      ? pRate
      : (PRICES.kitchenPaneling[kp.tallPantryFinish as keyof typeof PRICES.kitchenPaneling] || 0)
    if (sqft > 0 && kpRate > 0) {
      items.push({ label: 'Kitchen Paneling', subLabel: kp.tallPantryFinish, l: parseFloat(kp.height) || 0, b: parseFloat(kp.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: kpRate, amount: sqft * kpRate })
    }
  }

  // Overhead Cabinet
  const ohc = components.overheadCabinet || {}
  if (ohc.height && ohc.width && ohc.overheadCabinetFinish) {
    const sqft = calculateSqft(ohc.height, ohc.width)
    const ohcRate = PRICES.overheadCabinetFinish[ohc.overheadCabinetFinish as keyof typeof PRICES.overheadCabinetFinish] || 0
    if (sqft > 0 && ohcRate > 0) {
      items.push({ label: 'Overhead Cabinet', subLabel: ohc.overheadCabinetFinish, l: parseFloat(ohc.height) || 0, b: parseFloat(ohc.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: ohcRate, amount: sqft * ohcRate })
    }
  }

  // Overhead Loft
  const ol = components.overheadLoft || {}
  if (ol.height && ol.width && ol.loftType) {
    const sqft = calculateSqft(ol.height, ol.width)
    let rate = 0
    let subLabel = ''
    if (ol.loftType === 'Box Loft') {
      const depth = (ol.depth || '450mm') as '450mm' | '600mm'
      if (ol.finish === 'Postforming') {
        rate = pRate
      } else {
        const boxPrices = PRICES.overheadBoxLoftFinish[depth]
        rate = boxPrices?.[ol.finish as keyof typeof boxPrices] || 0
      }
      subLabel = `${ol.loftType} ${depth} ${ol.finish || ''}`
    } else {
      const basePrice = PRICES.overheadLoft[ol.loftType as keyof typeof PRICES.overheadLoft] || 0
      const finishPrice = ol.finish === 'Postforming'
        ? pRate
        : (PRICES.overheadFinish[ol.finish as keyof typeof PRICES.overheadFinish] || 0)
      rate = basePrice + finishPrice
      subLabel = `Carcass ${ol.loftType}`
    }
    if (sqft > 0 && rate > 0) {
      items.push({ label: 'Overhead Loft', subLabel, l: parseFloat(ol.height) || 0, b: parseFloat(ol.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
    }
  }

  // Profile Shutter with Glass
  const ps = components.profileShutter || {}
  const psHeight = parseFloat(ps.height) || 0
  const psWidth = parseFloat(ps.width) || 0
  if (psHeight > 0 && psWidth > 0 && ps.glassFinish) {
    const psSqft = calculateSqft(ps.height, ps.width)
    const psRate = PRICES.profileShutterGlass[ps.glassFinish as keyof typeof PRICES.profileShutterGlass] || 0
    if (psSqft > 0 && psRate > 0) {
      items.push({ label: 'Profile Shutter with Glass', subLabel: ps.glassFinish, l: psHeight, b: psWidth, sqft: Math.round(psSqft), quantity: 1, totalSqft: Math.round(psSqft), rate: psRate, amount: psSqft * psRate })
    }
  }

  // Magic Corner
  const mc = components.magicCorner || {}
  if (mc.magicCornerType && PRICES.magicCorner[mc.magicCornerType as keyof typeof PRICES.magicCorner]) {
    const mcPrice = PRICES.magicCorner[mc.magicCornerType as keyof typeof PRICES.magicCorner]
    items.push({ label: 'Magic Corner', subLabel: mc.magicCornerType, quantity: 1, totalSqft: 1, rate: mcPrice, amount: mcPrice })
  }

  // Rolling Shutter
  const rs = components.rollingShutter || {}
  if (rs.rollingShutterType && PRICES.rollingShutter[rs.rollingShutterType as keyof typeof PRICES.rollingShutter]) {
    const rsPrice = PRICES.rollingShutter[rs.rollingShutterType as keyof typeof PRICES.rollingShutter]
    items.push({ label: 'Rolling Shutter', subLabel: rs.rollingShutterType, quantity: 1, totalSqft: 1, rate: rsPrice, amount: rsPrice })
  }

  // Vanity Closing
  const vc = components.vanityClosing || {}
  const vcType = vc.material as 'Frame' | 'Carcase' | undefined
  const vcFinish = vc.tallPantryFinish as 'SF' | 'Gloss' | undefined
  if (vcType && vcFinish && PRICES.vanityClosing[vcType]) {
    const vcRate = PRICES.vanityClosing[vcType][vcFinish] || 0
    const vcSqft = calculateSqft(vc.height, vc.width)
    if (vcSqft > 0 && vcRate > 0) {
      items.push({ label: 'Vanity Closing', subLabel: `${vcType} — ${vcFinish}`, l: parseFloat(vc.height) || 0, b: parseFloat(vc.width) || 0, sqft: Math.round(vcSqft), quantity: 1, totalSqft: Math.round(vcSqft), rate: vcRate, amount: vcSqft * vcRate })
    }
  }

  // Handles
  const hd = components.handles || {}
  const handleFeet = parseFloat(hd.runningFeet) || 0
  const handlePrice = parseFloat(hd.handlePrice) || 0
  if (handleFeet > 0 && handlePrice > 0) {
    items.push({ label: 'Handles', subLabel: hd.handleType, quantity: handleFeet, totalSqft: handleFeet, rate: handlePrice, amount: handleFeet * handlePrice })
  }

  return items
}

// ── Living Room Items ──

function getLivingRoomItems(livingRoomEstimate: any): ExportItem[] {
  const items: ExportItem[] = []
  if (!livingRoomEstimate || !livingRoomEstimate.components) return items

  const comps = livingRoomEstimate.components

  // Chest of Drawers
  const cod = comps.chestOfDrawers || {}
  if (cod.height && cod.width && cod.tallPantryFinish) {
    const sqft = calculateSqft(cod.height, cod.width)
    const rate = PRICES.livingRoomFinish[cod.tallPantryFinish as keyof typeof PRICES.livingRoomFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Chest of Drawers', subLabel: `Carcass ${cod.tallPantryFinish}`, l: parseFloat(cod.height) || 0, b: parseFloat(cod.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  // Base Cabinet
  const bc = comps.baseCabinet || {}
  if (bc.height && bc.width && bc.tallPantryFinish) {
    const sqft = calculateSqft(bc.height, bc.width)
    const rate = PRICES.livingRoomFinish[bc.tallPantryFinish as keyof typeof PRICES.livingRoomFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Base Cabinet with shutters', subLabel: `Carcass ${bc.tallPantryFinish}`, l: parseFloat(bc.height) || 0, b: parseFloat(bc.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  // Tall Unit
  const ltu = comps.livingRoomTallUnit || {}
  if (ltu.height && ltu.width && ltu.tallPantryFinish) {
    const sqft = calculateSqft(ltu.height, ltu.width)
    const rate = PRICES.livingRoomTallUnitFinish[ltu.tallPantryFinish as keyof typeof PRICES.livingRoomTallUnitFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Tall Unit', subLabel: `Carcass ${ltu.tallPantryFinish}`, l: parseFloat(ltu.height) || 0, b: parseFloat(ltu.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  // Back Panel
  const bp = comps.backPanel || {}
  if (bp.height && bp.width && bp.loftType) {
    const sqft = calculateSqft(bp.height, bp.width)
    const rate = PRICES.backPanelFinish[bp.loftType as keyof typeof PRICES.backPanelFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Back Panel', subLabel: bp.loftType, l: parseFloat(bp.height) || 0, b: parseFloat(bp.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  // Ledge/Shelf
  const ls = comps.ledgeShelf || {}
  const lsSqft = calculateSqft(ls.height, ls.width)
  const lsQty = parseFloat(ls.quantity) || 1
  if (lsSqft > 0) {
    items.push({ label: 'Ledge/Shelf', subLabel: 'Sitting', l: parseFloat(ls.height) || 0, b: parseFloat(ls.width) || 0, sqft: lsSqft, quantity: lsQty, totalSqft: lsSqft * lsQty, rate: PRICES.ledgeShelf, amount: lsSqft * PRICES.ledgeShelf * lsQty })
  }

  // Fluted Panel
  const fp = comps.flutedPanel || {}
  const fpQty = parseFloat(fp.quantity) || 0
  if (fpQty > 0) {
    items.push({ label: 'Wall Décor', subLabel: 'Fluted Panel', quantity: fpQty, totalSqft: fpQty, rate: PRICES.flutedPanel, amount: fpQty * PRICES.flutedPanel })
  }

  // Shoe Rack
  const sr = comps.shoeRack || {}
  if (sr.height && sr.width && sr.tallPantryFinish) {
    const sqft = calculateSqft(sr.height, sr.width)
    const rate = PRICES.livingRoomFinish[sr.tallPantryFinish as keyof typeof PRICES.livingRoomFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Shoe Rack', subLabel: `Carcass ${sr.tallPantryFinish}`, l: parseFloat(sr.height) || 0, b: parseFloat(sr.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  // Sitting with Cushion
  const swc = comps.sittingWithCushion || {}
  const swcSqft = calculateSqft(swc.height, swc.width)
  if (swcSqft > 0) {
    items.push({ label: 'Sitting', subLabel: 'with Cushion', l: parseFloat(swc.height) || 0, b: parseFloat(swc.width) || 0, sqft: swcSqft, quantity: 1, totalSqft: swcSqft, rate: PRICES.sittingWithCushion, amount: swcSqft * PRICES.sittingWithCushion })
  }

  return items
}

// ── Bedroom Items ──

function getBedroomItems(bedroom: any, postformingRate: string): ExportItem[] {
  const items: ExportItem[] = []
  if (!bedroom) return items
  const pRate = getPostformingRate(postformingRate)

  // Wardrobe
  const wd = bedroom.wardrobe || {}
  if (wd.height && wd.width && wd.finish) {
    const sqft = calculateSqft(wd.height, wd.width)
    let rate = wd.finish === 'Postforming' ? pRate : (PRICES.bedroomWardrobeFinish[wd.finish] || 0)
    let amount = sqft * rate
    if (wd.slidingMechanism) amount += PRICES.bedroomWardrobeSlidingMechanism
    if (sqft > 0 && amount > 0) {
      items.push({ label: 'Wardrobe', subLabel: `${wd.wardrobeType || ''} — ${wd.finish}`, l: parseFloat(wd.height) || 0, b: parseFloat(wd.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount })
      if (wd.slidingMechanism) {
        items.push({ label: '', subLabel: 'Sliding Mechanism (Add-on)', quantity: 1, totalSqft: 1, rate: PRICES.bedroomWardrobeSlidingMechanism, amount: PRICES.bedroomWardrobeSlidingMechanism })
      }
    }
  }

  // Loft
  const lf = bedroom.loft || {}
  if (lf.height && lf.width && lf.loftType && lf.finish) {
    const sqft = calculateSqft(lf.height, lf.width)
    let rate = lf.finish === 'Postforming' ? pRate : (PRICES.bedroomLoftFinish[lf.loftType]?.[lf.finish] || 0)
    if (sqft > 0 && rate > 0) {
      items.push({ label: 'Loft', subLabel: `${lf.loftType} — ${lf.finish}`, l: parseFloat(lf.height) || 0, b: parseFloat(lf.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
    }
  }

  // Window Seat with Storage
  const ws = bedroom.windowSeat || {}
  if (ws.height && ws.width && ws.finish) {
    const sqft = calculateSqft(ws.height, ws.width)
    let rate = ws.finish === 'Postforming' ? pRate : getEffectiveRate(ws.finish, PRICES.bedroomTallUnitFinish)
    if (sqft > 0 && rate > 0) {
      items.push({ label: 'Window Seat with Storage', subLabel: ws.finish, l: parseFloat(ws.height) || 0, b: parseFloat(ws.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
    }
  }

  // Study Table (base + overhead)
  const st = bedroom.studyTable || {}
  const stBase = st.base || {}
  const stOh = st.overhead || {}
  const stBaseSqft = calculateSqft(stBase.height, stBase.width)
  const stOhSqft = calculateSqft(stOh.height, stOh.width)
  const stTotalSqft = stBaseSqft + stOhSqft
  if (stTotalSqft > 0 && st.finish) {
    let rate = st.finish === 'Postforming' ? pRate : getEffectiveRate(st.finish, PRICES.bedroomTallUnitFinish)
    if (rate > 0) {
      if (stBaseSqft > 0) {
        items.push({ label: 'Study Table', subLabel: `Base — ${st.finish}`, l: parseFloat(stBase.height) || 0, b: parseFloat(stBase.width) || 0, sqft: stBaseSqft, quantity: 1, totalSqft: stBaseSqft, rate, amount: stBaseSqft * rate })
      }
      if (stOhSqft > 0) {
        items.push({ label: 'Study Table', subLabel: `Overhead — ${st.finish}`, l: parseFloat(stOh.height) || 0, b: parseFloat(stOh.width) || 0, sqft: stOhSqft, quantity: 1, totalSqft: stOhSqft, rate, amount: stOhSqft * rate })
      }
    }
  }

  // Dresser Unit (base drawers + mirror with storage + mirror on back panel)
  const dr = bedroom.dresserUnit || {}
  const drBase = dr.baseDrawers || {}
  const drMs = dr.mirrorWithStorage || {}
  const drMbp = dr.mirrorOnBackPanel || {}
  const drBaseSqft = calculateSqft(drBase.height, drBase.width)
  const drMsSqft = calculateSqft(drMs.height, drMs.width)
  const drMbpSqft = calculateSqft(drMbp.height, drMbp.width)
  const drTotalSqft = drBaseSqft + drMsSqft + drMbpSqft
  if (drTotalSqft > 0 && dr.finish) {
    let rate = dr.finish === 'Postforming' ? pRate : getEffectiveRate(dr.finish, PRICES.bedroomTallUnitFinish)
    if (rate > 0) {
      if (drBaseSqft > 0) {
        items.push({ label: 'Dresser Unit', subLabel: `Base Drawers — ${dr.finish}`, l: parseFloat(drBase.height) || 0, b: parseFloat(drBase.width) || 0, sqft: drBaseSqft, quantity: 1, totalSqft: drBaseSqft, rate, amount: drBaseSqft * rate })
      }
      if (drMsSqft > 0) {
        items.push({ label: 'Dresser Unit', subLabel: `Mirror with Storage — ${dr.finish}`, l: parseFloat(drMs.height) || 0, b: parseFloat(drMs.width) || 0, sqft: drMsSqft, quantity: 1, totalSqft: drMsSqft, rate, amount: drMsSqft * rate })
      }
      if (drMbpSqft > 0) {
        items.push({ label: 'Dresser Unit', subLabel: `Mirror on Back Panel — ${dr.finish}`, l: parseFloat(drMbp.height) || 0, b: parseFloat(drMbp.width) || 0, sqft: drMbpSqft, quantity: 1, totalSqft: drMbpSqft, rate, amount: drMbpSqft * rate })
      }
    }
  }

  // Bed
  const bd = bedroom.bed || {}
  if (bd.typeOfBed) {
    if (bd.typeOfBed === 'Open Bed with Legs') {
      items.push({ label: 'Bed', subLabel: bd.typeOfBed, quantity: 1, totalSqft: 1, rate: PRICES.bedroomOpenBedPrice, amount: PRICES.bedroomOpenBedPrice })
    } else if (bd.height && bd.width && bd.finish) {
      const sqft = calculateSqft(bd.height, bd.width)
      let rate = bd.finish === 'Postforming' ? pRate : getEffectiveRate(bd.finish, PRICES.bedroomTallUnitFinish)
      let amount = sqft * rate
      if (bd.typeOfBed === 'Hydraulic (Automatic)' || bd.typeOfBed === 'Pullout Trolly Bed') {
        amount += PRICES.bedroomHydraulicMechanismPrice
      }
      if (sqft > 0 && amount > 0) {
        items.push({ label: 'Bed', subLabel: `${bd.typeOfBed} — ${bd.finish}`, l: parseFloat(bd.height) || 0, b: parseFloat(bd.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount })
        if (bd.typeOfBed === 'Hydraulic (Automatic)' || bd.typeOfBed === 'Pullout Trolly Bed') {
          items.push({ label: '', subLabel: 'Mechanism Cost', quantity: 1, totalSqft: 1, rate: PRICES.bedroomHydraulicMechanismPrice, amount: PRICES.bedroomHydraulicMechanismPrice })
        }
      }
    }
  }

  // Head Board
  const hb = bedroom.headBoard || {}
  if (hb.length && hb.width && hb.headBoardType) {
    const sqft = calculateSqft(hb.length, hb.width)
    const rate = PRICES.bedroomHeadBoardRates[hb.headBoardType] || 0
    if (sqft > 0 && rate > 0) {
      items.push({ label: 'Head Board', subLabel: hb.headBoardType, l: parseFloat(hb.length) || 0, b: parseFloat(hb.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
    }
  }

  return items
}

// ── Custom Components ──

function getCustomItems(customComponents: Array<{ id: string; name: string; height: string; width: string; rate: string }>): ExportItem[] {
  const items: ExportItem[] = []
  if (!customComponents || customComponents.length === 0) return items

  for (const comp of customComponents) {
    const sqft = calculateSqft(comp.height, comp.width)
    const rate = parseFloat(comp.rate) || 0
    if (comp.name && sqft > 0 && rate > 0) {
      items.push({
        label: comp.name,
        subLabel: 'Custom Component',
        l: parseFloat(comp.height) || 0,
        b: parseFloat(comp.width) || 0,
        sqft,
        quantity: 1,
        totalSqft: sqft,
        rate,
        amount: sqft * rate,
      })
    }
  }
  return items
}

// ── Main POST handler ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const d = validateData(body)

    const workbook = new Workbook()

    // ========================================
    // SHEET 1: Quotation
    // ========================================
    const qs = workbook.addWorksheet('Quotation')

    // Logo
    const logoPath = path.join(process.cwd(), 'upload', 'pioneer 2.jpg')
    const lw = d.logoSettings?.width || 350
    const lh = d.logoSettings?.height || 140
    const lpos = d.logoSettings?.position || 'center'
    const colPositions: Record<string, number> = { left: 0.1, center: 1.5, right: 4.5 }
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      const logoImageId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' })
      qs.addImage(logoImageId, { tl: { col: colPositions[lpos] || 1.5, row: 0 }, ext: { width: lw, height: lh } })
    }

    // Address
    qs.mergeCells('A3:H3')
    const c2 = qs.getCell('A3')
    c2.value = 'GAT. NO.63, PLOT NO. 6/B, A/P SHINDEWADI, TAL. BHOR, DIST. PUNE-412205'
    c2.font = { size: 10, name: 'Calibri' }
    c2.alignment = { horizontal: 'center' }

    // Date
    qs.getCell('E4').value = 'DATE:'
    qs.getCell('E4').font = { bold: true, name: 'Calibri' }
    qs.getCell('E4').alignment = { horizontal: 'right' }
    qs.mergeCells('F4:H4')
    const dateVal = qs.getCell('F4')
    dateVal.value = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    dateVal.font = { name: 'Calibri' }

    // To
    qs.getCell('B6').value = 'To,'
    qs.getCell('B6').font = { bold: true, name: 'Calibri' }
    qs.mergeCells('B7:H7')
    qs.getCell('B7').value = d.clientInfo.name || ''
    qs.getCell('B7').font = { bold: true, size: 12, name: 'Calibri' }

    // Subject
    qs.mergeCells('A10:H10')
    const subCell = qs.getCell('A10')
    subCell.value = 'SUB:- Tentative costing For Household Modular Furniture and Accessories at your Residence.'
    subCell.font = { bold: true, size: 11, name: 'Calibri' }

    // Table Header
    const headerRow = 12
    qs.getRow(headerRow).font = { bold: true, name: 'Calibri' }
    qs.getRow(headerRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }
    qs.getCell(`A${headerRow}`).value = 'Sr.No.'
    qs.getCell(`B${headerRow}`).value = 'Particulars'
    qs.getCell(`C${headerRow}`).value = 'Qty.'
    qs.getCell(`D${headerRow}`).value = 'Amount'

    // Collect ALL items
    const livingRoomItems = getLivingRoomItems(d.livingRoomEstimate)
    const kitchenItems = getKitchenItems(d.components, d.kitchenType, d.postformingRate || '')
    const kitchenCustomItems = getCustomItems(d.kitchenCustomComponents)
    const livingRoomCustomItems = getCustomItems(d.livingRoomCustomComponents)

    // Bedroom items per category
    const BEDROOM_LABELS: Record<string, string> = { master: 'MASTER BEDROOM', guest: 'GUEST BEDROOM', kids: 'KIDS BEDROOM' }
    const bedroomCategories = d.bedroomsEstimate ? Object.keys(d.bedroomsEstimate) : []
    const bedroomItemsMap: Record<string, ExportItem[]> = {}
    const bedroomCustomMap: Record<string, ExportItem[]> = {}
    for (const cat of bedroomCategories) {
      bedroomItemsMap[cat] = getBedroomItems(d.bedroomsEstimate![cat], d.postformingRate || '')
      bedroomCustomMap[cat] = getCustomItems(d.bedroomCustomComponents?.[cat] || [])
    }

    let rowNum = headerRow + 1
    let srNo = 1
    let totalAmount = 0

    // Helper: write a section
    const writeSection = (sectionName: string, items: ExportItem[]) => {
      if (items.length === 0) return
      qs.mergeCells(`B${rowNum}:D${rowNum}`)
      qs.getCell(`B${rowNum}`).value = sectionName
      qs.getCell(`B${rowNum}`).font = { bold: true, size: 12, name: 'Calibri' }
      rowNum++

      items.forEach((item) => {
        qs.getCell(`A${rowNum}`).value = `${srNo}]`
        qs.getCell(`A${rowNum}`).font = { name: 'Calibri' }

        if (item.label) {
          qs.getCell(`B${rowNum}`).value = item.label
          qs.getCell(`B${rowNum}`).font = { bold: true, name: 'Calibri' }
        }

        const qtyText = item.sqft ? String(Math.round(item.sqft)) : (item.quantity ? String(Math.round(item.quantity)) : '1')
        qs.getCell(`C${rowNum}`).value = qtyText
        qs.getCell(`C${rowNum}`).alignment = { horizontal: 'center' }
        qs.getCell(`C${rowNum}`).font = { name: 'Calibri' }

        if (item.amount > 0) {
          qs.getCell(`D${rowNum}`).value = Math.round(item.amount)
          qs.getCell(`D${rowNum}`).numFmt = '"₹"#,##0'
          qs.getCell(`D${rowNum}`).alignment = { horizontal: 'right' }
          qs.getCell(`D${rowNum}`).font = { name: 'Calibri' }
          totalAmount += item.amount
        }
        rowNum++

        if (item.subLabel) {
          qs.mergeCells(`B${rowNum}:D${rowNum}`)
          qs.getCell(`B${rowNum}`).value = item.subLabel
          qs.getCell(`B${rowNum}`).alignment = { indent: 1 }
          qs.getCell(`B${rowNum}`).font = { size: 9, name: 'Calibri' }
          rowNum++
        }

        if (item.l && item.b) {
          qs.mergeCells(`B${rowNum}:D${rowNum}`)
          qs.getCell(`B${rowNum}`).value = `Size: ${item.l}mm x ${item.b}mm`
          qs.getCell(`B${rowNum}`).alignment = { indent: 1 }
          qs.getCell(`B${rowNum}`).font = { size: 9, name: 'Calibri' }
          rowNum++
        }
        srNo++
      })
      rowNum++
    }

    // Write sections in order
    if (d.clientInfo.serviceType === 'Full Interior') {
      writeSection('LIVING ROOM', livingRoomItems)
      if (livingRoomCustomItems.length > 0) writeSection('LIVING ROOM — CUSTOM', livingRoomCustomItems)
    }

    writeSection('KITCHEN', kitchenItems)
    if (kitchenCustomItems.length > 0) writeSection('KITCHEN — CUSTOM', kitchenCustomItems)

    // Bedroom sections
    if (d.clientInfo.serviceType === 'Full Interior') {
      for (const cat of bedroomCategories) {
        const label = BEDROOM_LABELS[cat] || cat.toUpperCase()
        const brItems = [...bedroomItemsMap[cat], ...bedroomCustomMap[cat]]
        if (brItems.length > 0) {
          writeSection(label, brItems)
        }
      }
    }

    // MISCELLANEOUS
    const MISC_RATES: Record<string, Record<string, number>> = {
      ceilingMaterial: { Gypsum: 105, Acrylic: 160, ACP: 180, Armstrong: 115, Glass: 350, PVC: 125 },
      lightPoint: { 'Primary Light Point': 750, 'Secondary Light Point': 450, 'Half Plug Point': 400, 'Full Plug Point': 700, 'Concealed Light Fitting': 150, 'Fan Fitting': 150 },
      paint: { 'Luster Paint': 38, 'Texture Paint': 115, 'Plastic Paint': 33, 'Distemper Paint': 27 },
    }
    const misc = d.miscEstimate
    let miscTotal = 0
    const miscExportItems: Array<{ label: string; qty?: string; amount: number }> = []

    if (misc) {
      const fc = misc.falseCeiling || {}
      if (fc.height && fc.width && fc.material) {
        const sqft = (parseFloat(fc.height) * parseFloat(fc.width)) / 92903
        const rate = MISC_RATES.ceilingMaterial[fc.material] || 0
        const amt = Math.round(sqft * rate)
        if (amt > 0) { miscExportItems.push({ label: `False Ceiling (${fc.type || fc.material})`, qty: Math.round(sqft) + ' sqft', amount: amt }); miscTotal += amt }
      }
      const ewItems = Array.isArray(misc.electricalWork) ? misc.electricalWork : []
      ewItems.forEach((ew: any) => {
        if (ew.lightPointType && ew.quantity) {
          const rate = MISC_RATES.lightPoint[ew.lightPointType] || 0
          const qty = parseFloat(ew.quantity) || 0
          const amt = Math.round(rate * qty)
          if (amt > 0) { miscExportItems.push({ label: `Electrical - ${ew.lightPointType}`, qty: qty + ' nos', amount: amt }); miscTotal += amt }
        }
      })
      const ptItems = Array.isArray(misc.painting) ? misc.painting : []
      ptItems.forEach((pt: any) => {
        if (pt.paintType && pt.totalArea) {
          const rate = MISC_RATES.paint[pt.paintType] || 0
          const area = parseFloat(pt.totalArea) || 0
          const amt = Math.round(rate * area)
          if (amt > 0) { miscExportItems.push({ label: `Painting - ${pt.paintType}`, qty: area + ' sqft', amount: amt }); miscTotal += amt }
        }
      })
    }

    if (miscExportItems.length > 0) {
      qs.mergeCells(`B${rowNum}:D${rowNum}`)
      qs.getCell(`B${rowNum}`).value = 'MISCELLANEOUS'
      qs.getCell(`B${rowNum}`).font = { bold: true, size: 12, name: 'Calibri' }
      rowNum++

      miscExportItems.forEach((item) => {
        qs.getCell(`A${rowNum}`).value = `${srNo}]`
        qs.getCell(`A${rowNum}`).font = { name: 'Calibri' }
        qs.mergeCells(`B${rowNum}:C${rowNum}`)
        qs.getCell(`B${rowNum}`).value = item.label.toUpperCase()
        qs.getCell(`B${rowNum}`).font = { name: 'Calibri' }
        qs.getCell(`D${rowNum}`).value = item.amount
        qs.getCell(`D${rowNum}`).numFmt = '"₹"#,##0'
        qs.getCell(`D${rowNum}`).alignment = { horizontal: 'right' }
        qs.getCell(`D${rowNum}`).font = { name: 'Calibri' }
        srNo++; rowNum++
      })
      rowNum++
    }

    // SUB TOTAL
    const subTotal = Math.round(totalAmount + miscTotal)
    qs.mergeCells(`B${rowNum}:C${rowNum}`)
    qs.getCell(`B${rowNum}`).value = 'SUB TOTAL'
    qs.getCell(`B${rowNum}`).font = { bold: true, size: 12, name: 'Calibri' }
    qs.getCell(`D${rowNum}`).value = subTotal
    qs.getCell(`D${rowNum}`).numFmt = '"₹"#,##0'
    qs.getCell(`D${rowNum}`).font = { bold: true, size: 12, name: 'Calibri' }
    qs.getCell(`D${rowNum}`).alignment = { horizontal: 'right' }
    rowNum++

    // DISCOUNT
    const discountPct = d.discountPercent || 0
    if (discountPct > 0) {
      const discountAmt = Math.round(subTotal * discountPct / 100)
      qs.mergeCells(`B${rowNum}:C${rowNum}`)
      qs.getCell(`B${rowNum}`).value = `DISCOUNT OFFERED FLAT ${discountPct}%`
      qs.getCell(`B${rowNum}`).font = { name: 'Calibri' }
      qs.getCell(`D${rowNum}`).value = -discountAmt
      qs.getCell(`D${rowNum}`).numFmt = '"₹"-#,##0'
      qs.getCell(`D${rowNum}`).font = { name: 'Calibri' }
      qs.getCell(`D${rowNum}`).alignment = { horizontal: 'right' }
      rowNum++

      const postDiscount = subTotal - discountAmt
      qs.mergeCells(`B${rowNum}:C${rowNum}`)
      qs.getCell(`B${rowNum}`).value = 'AMOUNT POST DISCOUNT'
      qs.getCell(`B${rowNum}`).font = { bold: true, name: 'Calibri' }
      qs.getCell(`D${rowNum}`).value = postDiscount
      qs.getCell(`D${rowNum}`).numFmt = '"₹"#,##0'
      qs.getCell(`D${rowNum}`).font = { bold: true, name: 'Calibri' }
      qs.getCell(`D${rowNum}`).alignment = { horizontal: 'right' }
      rowNum++

      qs.mergeCells(`B${rowNum}:C${rowNum}`)
      qs.getCell(`B${rowNum}`).value = 'GRAND TOTAL (All Inclusive)'
      qs.getCell(`B${rowNum}`).font = { bold: true, size: 13, name: 'Calibri' }
      qs.getRow(rowNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4E157' } }
      qs.getCell(`D${rowNum}`).value = postDiscount
      qs.getCell(`D${rowNum}`).numFmt = '"₹"#,##0'
      qs.getCell(`D${rowNum}`).font = { bold: true, size: 13, name: 'Calibri' }
      qs.getCell(`D${rowNum}`).alignment = { horizontal: 'right' }
    } else {
      qs.mergeCells(`B${rowNum}:C${rowNum}`)
      qs.getCell(`B${rowNum}`).value = 'GRAND TOTAL (All Inclusive)'
      qs.getCell(`B${rowNum}`).font = { bold: true, size: 13, name: 'Calibri' }
      qs.getRow(rowNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4E157' } }
      qs.getCell(`D${rowNum}`).value = subTotal
      qs.getCell(`D${rowNum}`).numFmt = '"₹"#,##0'
      qs.getCell(`D${rowNum}`).font = { bold: true, size: 13, name: 'Calibri' }
      qs.getCell(`D${rowNum}`).alignment = { horizontal: 'right' }
    }
    rowNum += 2

    // TERMS
    qs.mergeCells(`B${rowNum}:H${rowNum}`)
    qs.getCell(`B${rowNum}`).value = 'TERMS & CONDITIONS:-'
    qs.getCell(`B${rowNum}`).font = { bold: true, size: 12, name: 'Calibri' }
    rowNum++

    const terms = [
      { no: '1]', text: 'Quotation is valid for One Month.' },
      { no: '2]', text: 'Any changes in design will be charged extra.' },
      { no: '3]', text: 'Advance 40% ,40% Pre dispatch stage & 20% Post Handover' },
      { no: '4]', text: 'Work will be commenced only after the Advance Given.' },
      { no: '5]', text: 'Hardware Fittings- HETTICH, All Door internal colour is same as External laminate' },
      { no: '', text: 'Delivery of Goods:- At site' },
      { no: '6]', text: 'The charges for Labour Unions & Mathadi Kamgar for  unloading upto the Installation will be borne by client.' },
      { no: '7]', text: 'Plumbing and Electrical fitting charges will be extra.' },
    ]
    terms.forEach((term) => {
      qs.mergeCells(`B${rowNum}:H${rowNum}`)
      if (term.no) {
        qs.getCell(`A${rowNum}`).value = term.no
        qs.getCell(`A${rowNum}`).font = { bold: true, name: 'Calibri', size: 10 }
        qs.getCell(`B${rowNum}`).value = term.text
      } else {
        qs.getCell(`B${rowNum}`).value = `     ${term.text}`
      }
      qs.getCell(`B${rowNum}`).font = { name: 'Calibri', size: 10 }
      rowNum++
    })

    rowNum++
    qs.mergeCells(`B${rowNum}:D${rowNum}`)
    qs.getCell(`B${rowNum}`).value = 'Regards,'
    qs.getCell(`B${rowNum}`).font = { name: 'Calibri' }
    rowNum++
    qs.mergeCells(`B${rowNum}:D${rowNum}`)
    qs.getCell(`B${rowNum}`).value = 'For Pioneer Enterprises'
    qs.getCell(`B${rowNum}`).font = { bold: true, name: 'Calibri' }
    rowNum++
    qs.mergeCells(`B${rowNum}:D${rowNum}`)
    qs.getCell(`B${rowNum}`).value = 'Mr.Milind Padgaonkar'
    qs.getCell(`B${rowNum}`).font = { name: 'Calibri' }

    qs.getColumn('A').width = 10
    qs.getColumn('B').width = 45
    qs.getColumn('C').width = 15
    qs.getColumn('D').width = 20
    qs.getColumn('E').width = 3
    qs.getColumn('F').width = 12
    qs.getColumn('G').width = 12
    qs.getColumn('H').width = 12

    // ========================================
    // SHEET 2: Workbook
    // ========================================
    const ws = workbook.addWorksheet('Workbook')
    ws.mergeCells('B1:I1')
    ws.getCell('B1').value = d.clientInfo.name || ''
    ws.getCell('B1').font = { bold: true, size: 14, name: 'Calibri' }

    const wbHeaderRow = 2
    ws.getRow(wbHeaderRow).font = { bold: true, name: 'Calibri', size: 10 }
    ws.getCell(`B${wbHeaderRow}`).value = ''
    ws.getCell(`C${wbHeaderRow}`).value = 'l'
    ws.getCell(`D${wbHeaderRow}`).value = 'b'
    ws.getCell(`E${wbHeaderRow}`).value = 'sq.ft'
    ws.getCell(`F${wbHeaderRow}`).value = 'Quantity'
    ws.getCell(`G${wbHeaderRow}`).value = 'Total quantity Sq.Ft'
    ws.getCell(`H${wbHeaderRow}`).value = 'Rate'
    ws.getCell(`I${wbHeaderRow}`).value = 'Amount'

    let wbRow = 3

    const writeWorkbookSection = (sectionName: string, items: ExportItem[]) => {
      if (items.length === 0) return
      ws.mergeCells(`B${wbRow}:I${wbRow}`)
      ws.getCell(`B${wbRow}`).value = sectionName
      ws.getCell(`B${wbRow}`).font = { bold: true, size: 12, name: 'Calibri' }
      wbRow++

      items.forEach((item) => {
        if (item.label) {
          ws.mergeCells(`B${wbRow}:I${wbRow}`)
          ws.getCell(`B${wbRow}`).value = item.label
          ws.getCell(`B${wbRow}`).font = { bold: true, name: 'Calibri' }
          wbRow++
        }
        if (item.subLabel) {
          ws.getCell(`B${wbRow}`).value = item.subLabel
          ws.getCell(`B${wbRow}`).font = { name: 'Calibri', size: 10 }
        }
        ws.getCell(`C${wbRow}`).value = item.l || ''
        ws.getCell(`C${wbRow}`).font = { name: 'Calibri' }
        ws.getCell(`D${wbRow}`).value = item.b || ''
        ws.getCell(`D${wbRow}`).font = { name: 'Calibri' }
        ws.getCell(`E${wbRow}`).value = item.sqft ? Math.round(item.sqft) : ''
        ws.getCell(`E${wbRow}`).font = { name: 'Calibri' }
        ws.getCell(`F${wbRow}`).value = item.quantity || 1
        ws.getCell(`F${wbRow}`).font = { name: 'Calibri' }
        const totalQtySqft = item.sqft ? (item.sqft * (item.quantity || 1)) : (item.quantity || 0)
        ws.getCell(`G${wbRow}`).value = totalQtySqft > 0 ? Math.round(totalQtySqft) : ''
        ws.getCell(`G${wbRow}`).font = { name: 'Calibri' }
        ws.getCell(`H${wbRow}`).value = item.rate || ''
        ws.getCell(`H${wbRow}`).font = { name: 'Calibri' }
        ws.getCell(`I${wbRow}`).value = Math.round(item.amount)
        ws.getCell(`I${wbRow}`).numFmt = '"₹"#,##0'
        ws.getCell(`I${wbRow}`).font = { name: 'Calibri' }
        wbRow++

        if (item.amount > 0) {
          ws.mergeCells(`B${wbRow}:H${wbRow}`)
          ws.getCell(`I${wbRow}`).value = Math.round(item.amount * 0.05)
          ws.getCell(`I${wbRow}`).numFmt = '"₹"#,##0'
          ws.getCell(`I${wbRow}`).font = { name: 'Calibri', size: 9, color: { argb: 'FF888888' } }
          wbRow++
        }
      })

      if (items.length > 0) {
        const sectionTotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0))
        ws.mergeCells(`B${wbRow}:H${wbRow}`)
        ws.getCell(`I${wbRow}`).value = sectionTotal
        ws.getCell(`I${wbRow}`).numFmt = '"₹"#,##0'
        ws.getCell(`I${wbRow}`).font = { bold: true, name: 'Calibri' }
        wbRow++
      }
      wbRow++
    }

    // Write workbook sections
    if (d.clientInfo.serviceType === 'Full Interior') {
      writeWorkbookSection('LIVING', livingRoomItems)
      if (livingRoomCustomItems.length > 0) writeWorkbookSection('LIVING — CUSTOM', livingRoomCustomItems)
    }
    writeWorkbookSection('KITCHEN', kitchenItems)
    if (kitchenCustomItems.length > 0) writeWorkbookSection('KITCHEN — CUSTOM', kitchenCustomItems)

    if (d.clientInfo.serviceType === 'Full Interior') {
      for (const cat of bedroomCategories) {
        const label = BEDROOM_LABELS[cat] || cat.toUpperCase()
        const brItems = [...bedroomItemsMap[cat], ...bedroomCustomMap[cat]]
        if (brItems.length > 0) writeWorkbookSection(label, brItems)
      }
    }

    ws.getColumn('A').width = 2
    ws.getColumn('B').width = 35
    ws.getColumn('C').width = 8
    ws.getColumn('D').width = 8
    ws.getColumn('E').width = 10
    ws.getColumn('F').width = 10
    ws.getColumn('G').width = 20
    ws.getColumn('H').width = 10
    ws.getColumn('I').width = 15

    // Generate
    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="estimate_${d.clientInfo.name || 'client'}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 })
  }
}
