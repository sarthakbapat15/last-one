import { NextRequest, NextResponse } from 'next/server'

interface EstimateData {
  clientInfo: {
    name: string
    address: string
    contact: string
    serviceType: string
  }
  kitchenType: string
  totalCost: number
  kitchenCost: number
  livingRoomCost: number
  components: Record<string, any>
  livingRoomEstimate?: Record<string, any>
}

function validateData(body: any): EstimateData {
  return {
    clientInfo: {
      name: body?.clientInfo?.name || '',
      address: body?.clientInfo?.address || '',
      contact: body?.clientInfo?.contact || '',
      serviceType: body?.clientInfo?.serviceType || ''
    },
    kitchenType: body?.kitchenType || '',
    totalCost: body?.totalCost || 0,
    kitchenCost: body?.kitchenCost || 0,
    livingRoomCost: body?.livingRoomCost || 0,
    components: body?.components || {},
    livingRoomEstimate: body?.livingRoomEstimate || undefined
  }
}

// Price constants (mirrored from frontend)
const PRICES = {
  tandemDrawers: { Olive: 8000, Blum: 12000, Hettich: 12000 },
  dustbinBTD: { Olive: 7500, Blum: 7500, Hettich: 7500 },
  bottlePullout: { Olive: 8000, Blum: 8000, Hettich: 8000 },
  wickerBasket: { Olive: 7500, Hettich: 7500 },
  plyVerticals: 1500,
  overheadLoft: { 'Frame Loft': 1150, 'Box Loft': 1250 },
  overheadFinish: { Acrylic: 1850, Laminate: 1200, UV: 1400, PU: 1600 },
  tallPantryFinish: { SF: 1450, HGL: 1550, Acrylic: 1850, 'Glass Acrylic': 2150 },
  pantryAccessories: { Pullout: 21000, 'Openable (6+6 basket)': 40000 },
  livingRoomFinish: { SF: 1250, HGL: 1350, Acrylic: 1550, 'Veneer with polish': 1750 },
  livingRoomTallUnitFinish: { SF: 1250, HGL: 1350, Acrylic: 1850, 'Veneer with polish': 1750 },
  backPanelFinish: { HGL: 650, SF: 550, Acrylic: 1175, Veneer: 950 },
  ledgeShelf: 350,
  flutedPanel: 900,
  sittingWithCushion: 1350,
  profileShutter: 350,
  countertopMaterial: { Granite: 550, Quartz: 650 },
  baseCarcase: 1650,
  overheadCabinetFinish: { SF: 1350, HGL: 1475, Acrylic: 2050, 'Glass Acrylic': 2250 }
}

const calculateSqft = (height: string, width: string): number => {
  const h = parseFloat(height) || 0
  const w = parseFloat(width) || 0
  return (h * w) / 92903
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

function getKitchenItems(components: any, kitchenType: string): ExportItem[] {
  const items: ExportItem[] = []

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

  const td = components.tandemDrawers || {}
  if (td.brand && PRICES.tandemDrawers[td.brand as keyof typeof PRICES.tandemDrawers]) {
    const qty = parseFloat(td.quantity) || 0
    const price = PRICES.tandemDrawers[td.brand as keyof typeof PRICES.tandemDrawers]
    if (qty > 0) items.push({ label: 'Tandem Drawers', subLabel: td.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  const db = components.dustbinBTD || {}
  if (db.brand && PRICES.dustbinBTD[db.brand as keyof typeof PRICES.dustbinBTD]) {
    const qty = parseFloat(db.quantity) || 0
    const price = PRICES.dustbinBTD[db.brand as keyof typeof PRICES.dustbinBTD]
    if (qty > 0) items.push({ label: 'Dustbin + BTD', subLabel: db.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  const bp = components.bottlePullout || {}
  if (bp.brand && PRICES.bottlePullout[bp.brand as keyof typeof PRICES.bottlePullout]) {
    const qty = parseFloat(bp.quantity) || 0
    const price = PRICES.bottlePullout[bp.brand as keyof typeof PRICES.bottlePullout]
    if (qty > 0) items.push({ label: 'Bottle Pullout', subLabel: bp.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  const wb = components.wickerBasket || {}
  if (wb.brand && PRICES.wickerBasket[wb.brand as keyof typeof PRICES.wickerBasket]) {
    const qty = parseFloat(wb.quantity) || 0
    const price = PRICES.wickerBasket[wb.brand as keyof typeof PRICES.wickerBasket]
    if (qty > 0) items.push({ label: 'Wicker Baskets', subLabel: wb.brand, quantity: qty, totalSqft: qty, rate: price, amount: qty * price })
  }

  const tu = components.tallUnit || {}
  if (tu.height && tu.width && tu.tallPantryFinish) {
    const sqft = calculateSqft(tu.height, tu.width)
    const rate = PRICES.tallPantryFinish[tu.tallPantryFinish as keyof typeof PRICES.tallPantryFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Tall Unit', subLabel: `Carcass ${tu.tallPantryFinish}`, l: parseFloat(tu.height) || 0, b: parseFloat(tu.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

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
      if (accPrice > 0) items.push({ label: '', subLabel: accType, quantity: 1, totalSqft: 1, rate: accPrice, amount: accPrice })
    }
  }

  // Base Carcase
  const bcc = components.baseCarcase || {}
  if (bcc.height && bcc.width) {
    const sqft = calculateSqft(bcc.height, bcc.width)
    if (sqft > 0) items.push({ label: 'Base Carcase', subLabel: 'CARCASE', l: parseFloat(bcc.height) || 0, b: parseFloat(bcc.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: PRICES.baseCarcase, amount: sqft * PRICES.baseCarcase })
  }

  // Overhead Cabinet
  const ohc = components.overheadCabinet || {}
  if (ohc.height && ohc.width && ohc.overheadCabinetFinish) {
    const sqft = calculateSqft(ohc.height, ohc.width)
    const ohcRate = PRICES.overheadCabinetFinish[ohc.overheadCabinetFinish as keyof typeof PRICES.overheadCabinetFinish] || 0
    if (sqft > 0 && ohcRate > 0) items.push({ label: 'Overhead Cabinet', subLabel: ohc.overheadCabinetFinish, l: parseFloat(ohc.height) || 0, b: parseFloat(ohc.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: ohcRate, amount: sqft * ohcRate })
  }

  const ol = components.overheadLoft || {}
  if (ol.height && ol.width && ol.loftType) {
    const sqft = calculateSqft(ol.height, ol.width)
    const basePrice = PRICES.overheadLoft[ol.loftType as keyof typeof PRICES.overheadLoft] || 0
    const finishPrice = ol.finish ? (PRICES.overheadFinish[ol.finish as keyof typeof PRICES.overheadFinish] || 0) : 0
    const totalRate = basePrice + finishPrice
    if (sqft > 0 && totalRate > 0) items.push({ label: 'Overhead Loft', subLabel: `Carcass ${ol.loftType}`, l: parseFloat(ol.height) || 0, b: parseFloat(ol.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate: totalRate, amount: sqft * totalRate })
  }

  const ps = components.profileShutter || {}
  const psQty = parseFloat(ps.quantity) || 0
  const psPrice = parseFloat(ps.price) || PRICES.profileShutter
  if (psQty > 0) items.push({ label: 'Profile Shutter with Glass', quantity: psQty, totalSqft: psQty, rate: psPrice, amount: psQty * psPrice })

  const hd = components.handles || {}
  const handleFeet = parseFloat(hd.runningFeet) || 0
  const handlePrice = parseFloat(hd.handlePrice) || 0
  if (handleFeet > 0 && handlePrice > 0) items.push({ label: 'Handles', subLabel: hd.handleType, quantity: handleFeet, totalSqft: handleFeet, rate: handlePrice, amount: handleFeet * handlePrice })

  return items
}

function getLivingRoomItems(livingRoomEstimate: any): ExportItem[] {
  const items: ExportItem[] = []
  if (!livingRoomEstimate || !livingRoomEstimate.components) return items

  const comps = livingRoomEstimate.components

  const cod = comps.chestOfDrawers || {}
  if (cod.height && cod.width && cod.tallPantryFinish) {
    const sqft = calculateSqft(cod.height, cod.width)
    const rate = PRICES.livingRoomFinish[cod.tallPantryFinish as keyof typeof PRICES.livingRoomFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Chest of Drawers', subLabel: `Carcass ${cod.tallPantryFinish}`, l: parseFloat(cod.height) || 0, b: parseFloat(cod.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  const bc = comps.baseCabinet || {}
  if (bc.height && bc.width && bc.tallPantryFinish) {
    const sqft = calculateSqft(bc.height, bc.width)
    const rate = PRICES.livingRoomFinish[bc.tallPantryFinish as keyof typeof PRICES.livingRoomFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Base Cabinet with shutters', subLabel: `Carcass ${bc.tallPantryFinish}`, l: parseFloat(bc.height) || 0, b: parseFloat(bc.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  const ltu = comps.livingRoomTallUnit || {}
  if (ltu.height && ltu.width && ltu.tallPantryFinish) {
    const sqft = calculateSqft(ltu.height, ltu.width)
    const rate = PRICES.livingRoomTallUnitFinish[ltu.tallPantryFinish as keyof typeof PRICES.livingRoomTallUnitFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Tall Unit', subLabel: `Carcass ${ltu.tallPantryFinish}`, l: parseFloat(ltu.height) || 0, b: parseFloat(ltu.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  const bp = comps.backPanel || {}
  if (bp.height && bp.width && bp.loftType) {
    const sqft = calculateSqft(bp.height, bp.width)
    const rate = PRICES.backPanelFinish[bp.loftType as keyof typeof PRICES.backPanelFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Back Panel', subLabel: bp.loftType, l: parseFloat(bp.height) || 0, b: parseFloat(bp.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  const ls = comps.ledgeShelf || {}
  const lsSqft = calculateSqft(ls.height, ls.width)
  const lsQty = parseFloat(ls.quantity) || 1
  if (lsSqft > 0) items.push({ label: 'Ledge/Shelf', subLabel: 'Sitting', l: parseFloat(ls.height) || 0, b: parseFloat(ls.width) || 0, sqft: lsSqft, quantity: lsQty, totalSqft: lsSqft * lsQty, rate: PRICES.ledgeShelf, amount: lsSqft * PRICES.ledgeShelf * lsQty })

  const fp = comps.flutedPanel || {}
  const fpQty = parseFloat(fp.quantity) || 0
  if (fpQty > 0) items.push({ label: 'Wall Décor', subLabel: 'Fluted Panel', quantity: fpQty, totalSqft: fpQty, rate: PRICES.flutedPanel, amount: fpQty * PRICES.flutedPanel })

  const sr = comps.shoeRack || {}
  if (sr.height && sr.width && sr.tallPantryFinish) {
    const sqft = calculateSqft(sr.height, sr.width)
    const rate = PRICES.livingRoomFinish[sr.tallPantryFinish as keyof typeof PRICES.livingRoomFinish] || 0
    if (sqft > 0 && rate > 0) items.push({ label: 'Shoe Rack', subLabel: `Carcass ${sr.tallPantryFinish}`, l: parseFloat(sr.height) || 0, b: parseFloat(sr.width) || 0, sqft, quantity: 1, totalSqft: sqft, rate, amount: sqft * rate })
  }

  const swc = comps.sittingWithCushion || {}
  const swcSqft = calculateSqft(swc.height, swc.width)
  if (swcSqft > 0) items.push({ label: 'Sitting', subLabel: 'with Cushion', l: parseFloat(swc.height) || 0, b: parseFloat(swc.width) || 0, sqft: swcSqft, quantity: 1, totalSqft: swcSqft, rate: PRICES.sittingWithCushion, amount: swcSqft * PRICES.sittingWithCushion })

  return items
}

const formatCurrency = (amount: number): string => {
  return '₹' + Math.abs(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateData(body)

    const { default: jsPDF } = await import('jspdf')

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 15

    // Company Name
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('PIONEER ENTERPRISES', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8

    // Company Address
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const address = 'GAT. NO.63, PLOT NO. 6/B, A/P SHINDEWADI, TAL. BHOR, DIST. PUNE-412205'
    const splitAddress = doc.splitTextToSize(address, pageWidth - 50)
    splitAddress.forEach((line: string) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 5
    })
    yPos += 8

    // Date
    doc.setFont('helvetica', 'bold')
    doc.text('DATE:', 120, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), 140, yPos)
    yPos += 10

    // To
    doc.setFont('helvetica', 'bold')
    doc.text('To,', 20, yPos)
    yPos += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(validatedData.clientInfo.name || '', 20, yPos)
    yPos += 12

    // Subject
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const subject = 'SUB:- Tentative costing For Household Modular Furniture and Accessories at your Residence.'
    const splitSubject = doc.splitTextToSize(subject, pageWidth - 40)
    splitSubject.forEach((line: string) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 6
    })
    yPos += 8

    // Table Header
    doc.setFontSize(10)
    doc.setFillColor(211, 211, 211)
    doc.rect(15, yPos - 4, pageWidth - 30, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Sr.No.', 17, yPos + 1)
    doc.text('Particulars', 35, yPos + 1)
    doc.text('Qty.', 130, yPos + 1)
    doc.text('Amount', 155, yPos + 1)
    yPos += 10

    // Collect items
    const livingRoomItems = getLivingRoomItems(validatedData.livingRoomEstimate)
    const kitchenItems = getKitchenItems(validatedData.components, validatedData.kitchenType)

    let srNo = 1
    let totalAmount = 0

    const writePdfSection = (sectionName: string, items: ExportItem[]) => {
      if (items.length === 0) return

      if (yPos > pageHeight - 80) {
        doc.addPage()
        yPos = 20
      }

      // Section header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(sectionName, 25, yPos)
      yPos += 8

      items.forEach((item) => {
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = 20
        }

        // Sr.No.
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(`${srNo}]`, 17, yPos)

        // Label
        if (item.label) {
          doc.setFont('helvetica', 'bold')
          doc.text(item.label, 25, yPos)
        }
        yPos += 6

        // Sub-label
        if (item.subLabel) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.text(`  ${item.subLabel}`, 25, yPos)
          yPos += 5
        }

        // Size
        if (item.l && item.b) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.text(`  Size: ${item.l}mm x ${item.b}mm`, 25, yPos)
          yPos += 5
        }

        // Qty and Amount on same line
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const qtyText = item.sqft ? item.sqft.toFixed(2) : (item.quantity ? String(item.quantity) : '1')
        doc.text(qtyText, 130, yPos)
        doc.text(formatCurrency(item.amount), 155, yPos)
        totalAmount += item.amount
        yPos += 8

        srNo++
      })

      yPos += 3
    }

    // Write sections
    if (validatedData.clientInfo.serviceType === 'Full Interior') {
      writePdfSection('LIVING ROOM', livingRoomItems)
    }
    writePdfSection('KITCHEN', kitchenItems)

    // SUB TOTAL
    if (yPos > pageHeight - 100) {
      doc.addPage()
      yPos = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('SUB TOTAL', 80, yPos)
    doc.text(formatCurrency(totalAmount), 155, yPos)
    yPos += 10

    // TRANSPORTATION CHARGES
    const transportCharges = 3000
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('TRANSPORTATION CHARGES', 80, yPos)
    doc.text(formatCurrency(transportCharges), 155, yPos)
    yPos += 10

    // DISCOUNT OFFERED FLAT 20%
    const discount = Math.round(totalAmount * 0.20)
    doc.text('DISCOUNT OFFERED FLAT 20%', 80, yPos)
    doc.text('-' + formatCurrency(discount), 155, yPos)
    yPos += 10

    // AMOUNT POST DISCOUNT
    const postDiscount = totalAmount - discount + transportCharges
    doc.setFont('helvetica', 'bold')
    doc.text('AMOUNT POST DISCOUNT', 80, yPos)
    doc.text(formatCurrency(postDiscount), 155, yPos)
    yPos += 10

    // ADD 18% GST
    const gstAmount = Math.round(postDiscount * 0.18)
    doc.text('ADD 18% GST', 80, yPos)
    doc.text(formatCurrency(gstAmount), 155, yPos)
    yPos += 12

    // GRAND TOTAL
    const grandTotal = postDiscount + gstAmount
    doc.setFillColor(212, 225, 87)
    doc.rect(80, yPos - 7, 80, 10, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('GRAND TOTAL (All Inclusive)', 82, yPos)
    doc.text(formatCurrency(grandTotal), 155, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 20

    // TERMS & CONDITIONS
    if (yPos > pageHeight - 120) {
      doc.addPage()
      yPos = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('TERMS & CONDITIONS:-', 20, yPos)
    yPos += 10

    const terms = [
      '1] Quotation is valid for One Month.',
      '2] Any changes in design will be charged extra.',
      '3] Advance 40% ,40% Pre dispatch stage & 20% Post Handover',
      '4] Work will be commenced only after the Advance Given.',
      '5] Hardware Fittings- HETTICH, All Door internal colour is same as External laminate',
      '    Delivery of Goods:- At site',
      '6] The charges for Labour Unions & Mathadi Kamgar for unloading upto the Installation will be borne by client.',
      '7] Plumbing and Electrical fitting charges will be extra.'
    ]

    terms.forEach((term) => {
      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = 20
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(term, 20, yPos)
      yPos += 7
    })

    // Regards
    yPos += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Regards,', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8
    doc.setFont('helvetica', 'bold')
    doc.text('For Pioneer Enterprises', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8
    doc.setFont('helvetica', 'normal')
    doc.text('Mr.Milind Padgaonkar', pageWidth / 2, yPos, { align: 'center' })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="estimate_${validatedData.clientInfo.name || 'client'}.pdf"`
      }
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF file' },
      { status: 500 }
    )
  }
}
