import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const offers = await prisma.additionalOffer.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(offers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, category } = await req.json()
    const offer = await prisma.additionalOffer.create({ data: { name, slug, category } })
    return NextResponse.json(offer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
