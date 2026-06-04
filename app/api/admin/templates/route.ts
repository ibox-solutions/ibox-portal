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
    const { searchParams } = new URL(req.url)
    const productGroupId = searchParams.get("productGroupId")

    const where: any = {}
    if (productGroupId) where.productGroupId = productGroupId

    const templates = await prisma.template.findMany({
      where,
      include: {
        productGroup: true,
      },
      orderBy: [
        { productGroup: { name: "asc" } },
        { isStandard: "desc" }, // standards first
        { name: "asc" },
      ],
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      name,
      description,
      productGroupId,
      htmlSlide,
      htmlWebsite,
      isActive,
      duplicateFromId,
    } = body

    if (!productGroupId) {
      return NextResponse.json(
        { error: "productGroupId is required" },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 }
      )
    }

    let finalHtmlSlide = htmlSlide || ""
    let finalHtmlWebsite = htmlWebsite || ""
    let finalDescription = description

    // If duplicating, copy content from source
    if (duplicateFromId) {
      const source = await prisma.template.findUnique({
        where: { id: duplicateFromId },
      })
      if (!source) {
        return NextResponse.json(
          { error: "Source template not found" },
          { status: 404 }
        )
      }
      finalHtmlSlide = source.htmlSlide
      finalHtmlWebsite = source.htmlWebsite
      if (!finalDescription) {
        finalDescription = `Kopie von "${source.name}"`
      }
    } else {
      // No duplicate source - try to use the standard for this group as starting point
      const standard = await prisma.template.findFirst({
        where: { productGroupId, isStandard: true },
      })
      if (standard) {
        finalHtmlSlide = finalHtmlSlide || standard.htmlSlide
        finalHtmlWebsite = finalHtmlWebsite || standard.htmlWebsite
      }
    }

    const template = await prisma.template.create({
      data: {
        name,
        description: finalDescription,
        productGroupId,
        isStandard: false, // new templates are always custom
        htmlSlide: finalHtmlSlide,
        htmlWebsite: finalHtmlWebsite,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        productGroup: true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}
