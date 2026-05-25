import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const designs = await prisma.design.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(designs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug } = await req.json()
    const design = await prisma.design.create({ data: { name, slug } })
    return NextResponse.json(design)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
