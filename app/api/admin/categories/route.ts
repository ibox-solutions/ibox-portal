import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const cats = await prisma.industryCategory.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(cats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, path } = await req.json()
    const cat = await prisma.industryCategory.create({ data: { name, slug, path } })
    return NextResponse.json(cat)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
