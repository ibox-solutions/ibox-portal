import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const groups = await prisma.productGroup.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, description, color } = await req.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })
    }

    const group = await prisma.productGroup.create({
      data: { name, slug, description, color },
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
