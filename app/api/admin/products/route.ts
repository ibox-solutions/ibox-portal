import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        productGroup: { select: { name: true } },
        _count: { select: { versions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, productGroupId } = await req.json()
    const product = await prisma.product.create({
      data: { name, slug, productGroupId },
    })
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
