import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const presentation = await prisma.presentation.findUnique({
      where: { id },
    })

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(presentation)
  } catch (error) {
    console.error("Error fetching presentation:", error)
    return NextResponse.json(
      { error: "Failed to fetch presentation" },
      { status: 500 }
    )
  }
}
