import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const countryId = searchParams.get("countryId")
  const teams = await prisma.team.findMany({
    where: countryId ? { countryId } : {},
    include: { country: true, _count: { select: { users: true, presentations: true } } },
    orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
  })
  return NextResponse.json(teams)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, countryId, description } = await req.json()
  const team = await prisma.team.create({ data: { name, countryId, description } })
  return NextResponse.json(team)
}
