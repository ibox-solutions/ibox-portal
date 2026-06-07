import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const countries = await prisma.country.findMany({
    include: { teams: { orderBy: { name: "asc" } }, _count: { select: { users: true, presentations: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(countries)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { code, name, language, flag } = await req.json()
  const country = await prisma.country.create({
    data: { id: `country_${code.toLowerCase()}`, code: code.toUpperCase(), name, language: language || "de", flag },
  })
  return NextResponse.json(country)
}
