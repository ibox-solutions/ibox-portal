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
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        productGroup: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, htmlSlide, htmlWebsite, isActive } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (htmlSlide !== undefined) data.htmlSlide = htmlSlide
    if (htmlWebsite !== undefined) data.htmlWebsite = htmlWebsite
    if (isActive !== undefined) data.isActive = isActive

    const template = await prisma.template.update({
      where: { id },
      data,
      include: {
        productGroup: true,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    // Protect standards from deletion
    const template = await prisma.template.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    if (template.isStandard) {
      return NextResponse.json(
        { error: "Standard-Templates können nicht gelöscht werden" },
        { status: 403 }
      )
    }

    await prisma.template.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
