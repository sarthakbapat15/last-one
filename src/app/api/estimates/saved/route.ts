import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET — list all saved estimates (newest first)
export async function GET() {
  try {
    const estimates = await db.savedEstimate.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        clientName: true,
        label: true,
        totalCost: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(estimates)
  } catch (error) {
    console.error('Failed to list saved estimates:', error)
    return NextResponse.json({ error: 'Failed to load saved estimates' }, { status: 500 })
  }
}

// POST — create a new saved estimate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, label, data, totalCost } = body

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    const saved = await db.savedEstimate.create({
      data: {
        clientName: clientName.trim(),
        label: (label || 'Untitled').trim(),
        data: JSON.stringify(data),
        totalCost: Math.round(totalCost) || 0,
      },
    })

    return NextResponse.json({ id: saved.id, message: 'Estimate saved successfully' })
  } catch (error) {
    console.error('Failed to save estimate:', error)
    return NextResponse.json({ error: 'Failed to save estimate' }, { status: 500 })
  }
}

// DELETE — delete a saved estimate by id (passed as query param)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Estimate ID is required' }, { status: 400 })
    }

    await db.savedEstimate.delete({ where: { id } })
    return NextResponse.json({ message: 'Estimate deleted' })
  } catch (error) {
    console.error('Failed to delete estimate:', error)
    return NextResponse.json({ error: 'Failed to delete estimate' }, { status: 500 })
  }
}
