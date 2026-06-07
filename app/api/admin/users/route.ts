import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const users = await prisma.user.findMany({
    include: {
      country: true,
      team: { include: { country: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Count presentations per user
  const presCount = await prisma.presentation.groupBy({
    by: ["createdByEmail"],
    _count: { id: true },
  })
  const presMap = Object.fromEntries(presCount.map((p) => [p.createdByEmail, p._count.id]))

  return NextResponse.json(users.map((u) => ({
    ...u,
    password: undefined,
    presentationCount: presMap[u.email] || 0,
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, email, password, role, countryId, teamId } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, Email und Passwort erforderlich" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email bereits vergeben" }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role || "MITARBEITER", countryId, teamId },
  })

  return NextResponse.json({ ...user, password: undefined })
}
