import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const versions = await prisma.productVersion.findMany({
      where: productId ? { productId } : {},
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(versions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { productId, version, description } = await req.json()
    if (!productId || !version) {
      return NextResponse.json({ error: 'productId und version erforderlich' }, { status: 400 })
    }
    const newVersion = await prisma.productVersion.create({
      data: { productId, version, description, isActive: true },
    })
    return NextResponse.json(newVersion, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
