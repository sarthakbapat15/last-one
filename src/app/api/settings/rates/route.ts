import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings/rates — fetch saved rate overrides from DB
export async function GET() {
  try {
    const settings = await db.appSettings.findUnique({ where: { id: 'singleton' } })
    if (!settings || !settings.rateOverrides || settings.rateOverrides === '{}') {
      return NextResponse.json({ overrides: null, version: '' })
    }
    return NextResponse.json({
      overrides: JSON.parse(settings.rateOverrides),
      version: settings.rateVersion,
    })
  } catch (error) {
    console.error('Failed to fetch rate settings:', error)
    return NextResponse.json({ overrides: null, version: '' }, { status: 500 })
  }
}

// PUT /api/settings/rates — save rate overrides to DB
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { overrides, version } = body as { overrides: Record<string, any>; version: string }

    await db.appSettings.upsert({
      where: { id: 'singleton' },
      update: {
        rateOverrides: JSON.stringify(overrides),
        rateVersion: version || '',
      },
      create: {
        id: 'singleton',
        rateOverrides: JSON.stringify(overrides),
        rateVersion: version || '',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save rate settings:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// DELETE /api/settings/rates — clear rate overrides (reset to defaults)
export async function DELETE() {
  try {
    await db.appSettings.upsert({
      where: { id: 'singleton' },
      update: {
        rateOverrides: '{}',
        rateVersion: '',
      },
      create: {
        id: 'singleton',
        rateOverrides: '{}',
        rateVersion: '',
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reset rate settings:', error)
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 })
  }
}
