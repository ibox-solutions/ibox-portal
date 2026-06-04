import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const productGroups = await prisma.productGroup.findMany({
      include: {
        products: {
          include: {
            versions: true,
          },
        },
        designs: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(productGroups)
  } catch (error) {
    console.error("Error fetching product groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch product groups" },
      { status: 500 }
    )
  }
}
