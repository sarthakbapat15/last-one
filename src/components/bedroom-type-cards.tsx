'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// ── Tall Unit Finish types (shared by window seat, study table, dresser, bed types 2-4) ──
export type TallUnitFinish = 'SF' | 'HGL' | 'Acrylic' | 'Veneer with polish' | 'Postforming'

export const DEFAULT_TALL_UNIT_FINISH_RATES: Record<string, number> = {
  SF: 1250,
  HGL: 1350,
  Acrylic: 1850,
  'Veneer with polish': 1750,
}

// ── Data Interfaces ──
export interface BedroomData {
  wardrobe: {
    height: string
    width: string
    wardrobeType: string
    finish: string
    slidingMechanism: boolean
  }
  loft: {
    height: string
    width: string
    loftType: string
    finish: string
  }
  windowSeat: {
    height: string
    width: string
    finish: string
  }
  studyTable: {
    base: { height: string; width: string }
    overhead: { height: string; width: string }
    finish: string
  }
  dresserUnit: {
    baseDrawers: { height: string; width: string }
    mirrorWithStorage: { height: string; width: string }
    mirrorOnBackPanel: { height: string; width: string }
    finish: string
  }
  bed: {
    typeOfBed: string
    height: string
    width: string
    finish: string
  }
  headBoard: {
    length: string
    width: string
    headBoardType: string
  }
}

export const createEmptyBedroom = (): BedroomData => ({
  wardrobe: { height: '', width: '', wardrobeType: '', finish: '', slidingMechanism: false },
  loft: { height: '', width: '', loftType: '', finish: '' },
  windowSeat: { height: '', width: '', finish: '' },
  studyTable: { base: { height: '', width: '' }, overhead: { height: '', width: '' }, finish: '' },
  dresserUnit: {
    baseDrawers: { height: '', width: '' },
    mirrorWithStorage: { height: '', width: '' },
    mirrorOnBackPanel: { height: '', width: '' },
    finish: '',
  },
  bed: { typeOfBed: '', height: '', width: '', finish: '' },
  headBoard: { length: '', width: '', headBoardType: '' },
})

// ── Prices Interface ──
export interface BedroomPrices {
  wardrobeFinish: Record<string, number>
  wardrobeSlidingMechanism: number
  bedroomLoftFinish: Record<string, Record<string, number>>
  tallUnitFinish: Record<string, number>
  headBoardRates: Record<string, number>
  openBedPrice: number
  hydraulicMechanismPrice: number
}

// ── Shared finish selector for tall-unit-finish components ──
function TallUnitFinishSelect({
  value,
  onChange,
  id,
  rates,
  postformingRate,
  onPostformingRateChange,
}: {
  value: string
  onChange: (v: string) => void
  id?: string
  rates: Record<string, number>
  postformingRate: string
  onPostformingRateChange: (v: string) => void
}) {
  return (
    <>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" id={id}>
        <SelectValue placeholder="Select finish" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(rates).map(([key, rate]) => (
          <SelectItem key={key} value={key}>
            {key} (₹{rate.toLocaleString('en-IN')}/sqft)
          </SelectItem>
        ))}
        <SelectItem value="Postforming">Postforming (Manual Rate)</SelectItem>
      </SelectContent>
    </Select>
    {value === 'Postforming' && (
      <div className="mt-1.5">
        <Label className="text-xs">Rate per sqft (₹)</Label>
        <Input
          type="number"
          placeholder="Enter rate"
          value={postformingRate}
          onChange={(e) => onPostformingRateChange(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    )}
    </>
  )
}

// ── Height/Width input pair ──
function HWInputs({
  height,
  width,
  onHeight,
  onWidth,
}: {
  height: string
  width: string
  onHeight: (v: string) => void
  onWidth: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Height (mm)</Label>
        <Input type="number" placeholder="0" value={height} onChange={(e) => onHeight(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Width (mm)</Label>
        <Input type="number" placeholder="0" value={width} onChange={(e) => onWidth(e.target.value)} />
      </div>
    </div>
  )
}

// ── Rate display ──
function RateDisplay({ rate, formatINR }: { rate: number; formatINR: (n: number) => string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Rate / sqft</Label>
      <Input value={rate > 0 ? formatINR(rate) : ''} disabled className="bg-white" />
    </div>
  )
}

// ── Props ──
interface BedroomTypeCardsProps {
  bedroom: BedroomData
  category: string
  wardrobeTotal: number
  loftTotal: number
  windowSeatTotal: number
  studyTableTotal: number
  dresserUnitTotal: number
  bedTotal: number
  headBoardTotal: number
  prices: BedroomPrices
  formatINR: (amount: number) => string
  tallUnitFinishRates: Record<string, number>
  onUpdateWardrobe: (field: string, value: string | boolean) => void
  onWardrobeTypeChange: (value: string) => void
  onUpdateLoft: (field: string, value: string) => void
  onLoftTypeChange: (value: string) => void
  onUpdateWindowSeat: (field: string, value: string) => void
  onUpdateStudyTableBase: (field: string, value: string) => void
  onUpdateStudyTableOverhead: (field: string, value: string) => void
  onStudyTableFinishChange: (value: string) => void
  onUpdateDresserBaseDrawers: (field: string, value: string) => void
  onUpdateDresserMirrorStorage: (field: string, value: string) => void
  onUpdateDresserMirrorBackPanel: (field: string, value: string) => void
  onDresserUnitFinishChange: (value: string) => void
  onBedTypeChange: (value: string) => void
  onUpdateBed: (field: string, value: string) => void
  onUpdateHeadBoard: (field: string, value: string) => void
  postformingRate: string
  onPostformingRateChange: (v: string) => void
}

export default function BedroomTypeCards({
  bedroom,
  category,
  wardrobeTotal,
  loftTotal,
  windowSeatTotal,
  studyTableTotal,
  dresserUnitTotal,
  bedTotal,
  headBoardTotal,
  prices,
  formatINR,
  tallUnitFinishRates,
  onUpdateWardrobe,
  onWardrobeTypeChange,
  onUpdateLoft,
  onLoftTypeChange,
  onUpdateWindowSeat,
  onUpdateStudyTableBase,
  onUpdateStudyTableOverhead,
  onStudyTableFinishChange,
  onUpdateDresserBaseDrawers,
  onUpdateDresserMirrorStorage,
  onUpdateDresserMirrorBackPanel,
  onDresserUnitFinishChange,
  onBedTypeChange,
  onUpdateBed,
  onUpdateHeadBoard,
  postformingRate,
  onPostformingRateChange,
}: BedroomTypeCardsProps) {
  const showBedDimensions = bedroom.bed.typeOfBed && bedroom.bed.typeOfBed !== 'Open Bed with Legs'
  const isAutomaticBed = bedroom.bed.typeOfBed === 'Hydraulic (Automatic)' || bedroom.bed.typeOfBed === 'Pullout Trolly Bed'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ─── 1. Wardrobe (fuchsia) ─── */}
      <Card className="bg-fuchsia-50 border-fuchsia-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-fuchsia-800 text-base">Wardrobe</CardTitle>
            <span className="text-sm font-semibold text-fuchsia-700">
              {formatINR(wardrobeTotal)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Wardrobe Type</Label>
            <Select value={bedroom.wardrobe.wardrobeType} onValueChange={onWardrobeTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sliding">Sliding</SelectItem>
                <SelectItem value="Hinged">Hinged</SelectItem>
                <SelectItem value="Open">Open (Walk in Wardrobe)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <HWInputs
            height={bedroom.wardrobe.height}
            width={bedroom.wardrobe.width}
            onHeight={(v) => onUpdateWardrobe('height', v)}
            onWidth={(v) => onUpdateWardrobe('width', v)}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Material Finish</Label>
            <Select value={bedroom.wardrobe.finish} onValueChange={(v) => onUpdateWardrobe('finish', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select finish" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(prices.wardrobeFinish).map(([finish, rate]) => (
                  <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                ))}
                <SelectItem value="Postforming">Postforming</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {bedroom.wardrobe.finish === 'Postforming' && (
            <div className="mt-1.5">
              <Label className="text-xs">Rate per sqft (₹)</Label>
              <Input
                type="number"
                placeholder="Enter rate"
                value={postformingRate}
                onChange={(e) => onPostformingRateChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
          <RateDisplay rate={prices.wardrobeFinish[bedroom.wardrobe.finish] || 0} formatINR={formatINR} />
          {bedroom.wardrobe.wardrobeType === 'Sliding' && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-fuchsia-200">
              <Checkbox
                id={`sliding-mechanism-${category}`}
                checked={bedroom.wardrobe.slidingMechanism}
                onCheckedChange={(checked) => onUpdateWardrobe('slidingMechanism', checked === true)}
                className="data-[state=checked]:bg-fuchsia-600 data-[state=checked]:border-fuchsia-600"
              />
              <div className="flex-1">
                <Label htmlFor={`sliding-mechanism-${category}`} className="text-xs font-medium cursor-pointer">Sliding Mechanism (Add-on)</Label>
                    <p className="text-xs text-muted-foreground">{formatINR(prices.wardrobeSlidingMechanism)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 2. Loft (cyan) ─── */}
      <Card className="bg-cyan-50 border-cyan-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-cyan-800 text-base">Loft</CardTitle>
            <span className="text-sm font-semibold text-cyan-700">
              {formatINR(loftTotal)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Loft Type</Label>
            <Select value={bedroom.loft.loftType} onValueChange={onLoftTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Frame">Frame</SelectItem>
                <SelectItem value="Box">Box</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <HWInputs
            height={bedroom.loft.height}
            width={bedroom.loft.width}
            onHeight={(v) => onUpdateLoft('height', v)}
            onWidth={(v) => onUpdateLoft('width', v)}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Material Finish</Label>
            <Select value={bedroom.loft.finish} onValueChange={(v) => onUpdateLoft('finish', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select finish" />
              </SelectTrigger>
              <SelectContent>
                {bedroom.loft.loftType && prices.bedroomLoftFinish[bedroom.loft.loftType] && (
                  <>
                    {Object.entries(prices.bedroomLoftFinish[bedroom.loft.loftType]).map(([finish, rate]) => (
                      <SelectItem key={finish} value={finish}>{finish} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                    ))}
                    <SelectItem value="Postforming">Postforming</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {bedroom.loft.finish === 'Postforming' && (
            <div className="mt-1.5">
              <Label className="text-xs">Rate per sqft (₹)</Label>
              <Input
                type="number"
                placeholder="Enter rate"
                value={postformingRate}
                onChange={(e) => onPostformingRateChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
          <RateDisplay
            rate={bedroom.loft.loftType && bedroom.loft.finish ? (prices.bedroomLoftFinish[bedroom.loft.loftType]?.[bedroom.loft.finish] || 0) : 0}
            formatINR={formatINR}
          />
        </CardContent>
      </Card>

      {/* ─── 3. Window Seat with Storage (emerald) ─── */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-emerald-800 text-base">Window Seat with Storage</CardTitle>
            <span className="text-sm font-semibold text-emerald-700">
              {formatINR(windowSeatTotal)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <HWInputs
            height={bedroom.windowSeat.height}
            width={bedroom.windowSeat.width}
            onHeight={(v) => onUpdateWindowSeat('height', v)}
            onWidth={(v) => onUpdateWindowSeat('width', v)}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Material Finish</Label>
            <TallUnitFinishSelect
              value={bedroom.windowSeat.finish}
              onChange={(v) => onUpdateWindowSeat('finish', v)}
              id={`window-seat-finish-${category}`}
              rates={tallUnitFinishRates}
              postformingRate={postformingRate}
              onPostformingRateChange={onPostformingRateChange}
            />
          </div>
          <RateDisplay rate={tallUnitFinishRates[bedroom.windowSeat.finish] || 0} formatINR={formatINR} />
        </CardContent>
      </Card>

      {/* ─── 4. Study Table (violet) ─── */}
      <Card className="bg-violet-50 border-violet-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-violet-800 text-base">Study Table</CardTitle>
            <span className="text-sm font-semibold text-violet-700">
              {formatINR(studyTableTotal)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Material Finish</Label>
            <TallUnitFinishSelect
              value={bedroom.studyTable.finish}
              onChange={onStudyTableFinishChange}
              id={`study-table-finish-${category}`}
              rates={tallUnitFinishRates}
              postformingRate={postformingRate}
              onPostformingRateChange={onPostformingRateChange}
            />
          </div>
          <RateDisplay rate={tallUnitFinishRates[bedroom.studyTable.finish] || 0} formatINR={formatINR} />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Base</p>
            <HWInputs
              height={bedroom.studyTable.base.height}
              width={bedroom.studyTable.base.width}
              onHeight={(v) => onUpdateStudyTableBase('height', v)}
              onWidth={(v) => onUpdateStudyTableBase('width', v)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Overhead</p>
            <HWInputs
              height={bedroom.studyTable.overhead.height}
              width={bedroom.studyTable.overhead.width}
              onHeight={(v) => onUpdateStudyTableOverhead('height', v)}
              onWidth={(v) => onUpdateStudyTableOverhead('width', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── 5. Dresser Unit (rose) — full width ─── */}
      <Card className="bg-rose-50 border-rose-200 lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-rose-800 text-base">Dresser Unit</CardTitle>
            <span className="text-sm font-semibold text-rose-700">
              {formatINR(dresserUnitTotal)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-5">
            <div className="max-w-xs space-y-1.5">
              <Label className="text-xs">Material Finish</Label>
              <TallUnitFinishSelect
                value={bedroom.dresserUnit.finish}
                onChange={onDresserUnitFinishChange}
                id={`dresser-finish-${category}`}
                rates={tallUnitFinishRates}
                postformingRate={postformingRate}
                onPostformingRateChange={onPostformingRateChange}
              />
            </div>
            <div className="max-w-xs">
              <RateDisplay rate={tallUnitFinishRates[bedroom.dresserUnit.finish] || 0} formatINR={formatINR} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Base Drawers */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Base Drawers</p>
              <HWInputs
                height={bedroom.dresserUnit.baseDrawers.height}
                width={bedroom.dresserUnit.baseDrawers.width}
                onHeight={(v) => onUpdateDresserBaseDrawers('height', v)}
                onWidth={(v) => onUpdateDresserBaseDrawers('width', v)}
              />
            </div>

            {/* Mirror with Storage */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Mirror with Storage</p>
              <HWInputs
                height={bedroom.dresserUnit.mirrorWithStorage.height}
                width={bedroom.dresserUnit.mirrorWithStorage.width}
                onHeight={(v) => onUpdateDresserMirrorStorage('height', v)}
                onWidth={(v) => onUpdateDresserMirrorStorage('width', v)}
              />
            </div>

            {/* Mirror on Back Panel */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Mirror on Back Panel</p>
              <HWInputs
                height={bedroom.dresserUnit.mirrorOnBackPanel.height}
                width={bedroom.dresserUnit.mirrorOnBackPanel.width}
                onHeight={(v) => onUpdateDresserMirrorBackPanel('height', v)}
                onWidth={(v) => onUpdateDresserMirrorBackPanel('width', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 6. Bed & Head Board (amber) — full width ─── */}
      <Card className="bg-amber-50 border-amber-200 lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-amber-800 text-base">Bed & Head Board</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-amber-700">
                Bed {formatINR(bedTotal)}
              </span>
              <span className="text-sm text-muted-foreground">+</span>
              <span className="text-sm font-semibold text-amber-700">
                Head Board {formatINR(headBoardTotal)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bed Section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Bed</p>

              {/* Type of Bed dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs">Type of Bed</Label>
                <Select value={bedroom.bed.typeOfBed} onValueChange={onBedTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
              <SelectContent>
                    <SelectItem value="Open Bed with Legs">Open Bed with Legs (₹{prices.openBedPrice.toLocaleString('en-IN')})</SelectItem>
                    <SelectItem value="Hydraulic (Manual)">Hydraulic (Manual)</SelectItem>
                    <SelectItem value="Hydraulic (Automatic)">Hydraulic (Automatic)</SelectItem>
                    <SelectItem value="Pullout Trolly Bed">Pullout Trolly Bed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Open Bed: fixed price display */}
              {bedroom.bed.typeOfBed === 'Open Bed with Legs' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Fixed Price</Label>
                  <Input value={formatINR(prices.openBedPrice)} disabled className="bg-white" />
                </div>
              )}

              {/* Dimensions + finish for options 2-4 */}
              {showBedDimensions && (
                <>
                  <HWInputs
                    height={bedroom.bed.height}
                    width={bedroom.bed.width}
                    onHeight={(v) => onUpdateBed('height', v)}
                    onWidth={(v) => onUpdateBed('width', v)}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Material Finish</Label>
                    <TallUnitFinishSelect
                      value={bedroom.bed.finish}
                      onChange={(v) => onUpdateBed('finish', v)}
                      id={`bed-finish-${category}`}
                      rates={tallUnitFinishRates}
                      postformingRate={postformingRate}
                      onPostformingRateChange={onPostformingRateChange}
                    />
                  </div>
                  <RateDisplay rate={tallUnitFinishRates[bedroom.bed.finish] || 0} formatINR={formatINR} />
                  {isAutomaticBed && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mechanism Cost</Label>
                      <Input value={formatINR(prices.hydraulicMechanismPrice)} disabled className="bg-white" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-amber-200" />

            {/* Head Board Section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Head Board</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Head Board Type</Label>
                <Select value={bedroom.headBoard.headBoardType} onValueChange={(v) => onUpdateHeadBoard('headBoardType', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(prices.headBoardRates).map(([type, rate]) => (
                      <SelectItem key={type} value={type}>{type} (₹{rate.toLocaleString('en-IN')}/sqft)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <HWInputs
                height={bedroom.headBoard.length}
                width={bedroom.headBoard.width}
                onHeight={(v) => onUpdateHeadBoard('length', v)}
                onWidth={(v) => onUpdateHeadBoard('width', v)}
              />
              <RateDisplay rate={prices.headBoardRates[bedroom.headBoard.headBoardType] || 0} formatINR={formatINR} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}