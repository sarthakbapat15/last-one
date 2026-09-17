import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET — fetch a single saved estimate by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const estimate = await db.savedEstimate.findUnique({ where: { id } })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: estimate.id,
      clientName: estimate.clientName,
      label: estimate.label,
      totalCost: estimate.totalCost,
      data: JSON.parse(estimate.data),
      createdAt: estimate.createdAt,
      updatedAt: estimate.updatedAt,
    })
  } catch (error) {
    console.error('Failed to load estimate:', error)
    return NextResponse.json({ error: 'Failed to load estimate' }, { status: 500 })
  }
}
