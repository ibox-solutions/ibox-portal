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
    const presentations = await prisma.presentation.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(presentations)
  } catch (error) {
    console.error("Error fetching presentations:", error)
    return NextResponse.json(
      { error: "Failed to fetch presentations" },
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
      baseProductVersionId,
      baseCategoryId,
      templateId,
      presentationType,
      customerCity,
      title,
    } = body

    if (!baseProductVersionId || !baseCategoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const [productVersion, category] = await Promise.all([
      prisma.productVersion.findUnique({
        where: { id: baseProductVersionId },
        include: { product: { include: { productGroup: true } } },
      }),
      prisma.industryCategory.findUnique({
        where: { id: baseCategoryId },
      }),
    ])

    if (!productVersion || !category) {
      return NextResponse.json(
        { error: "Invalid product or category" },
        { status: 400 }
      )
    }

    // Load template: by id if specified, else find the standard for this productGroup
    let template = null
    if (templateId) {
      template = await prisma.template.findUnique({ where: { id: templateId } })
    }
    if (!template) {
      template = await prisma.template.findFirst({
        where: {
          productGroupId: productVersion.product.productGroupId,
          isStandard: true,
        },
      })
    }

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: "Kein aktives Template für diese Produktgruppe gefunden" },
        { status: 400 }
      )
    }

    const placeholders = {
      productName: productVersion.product.name,
      productDescription:
        productVersion.product.description ||
        "Hochwertige Digital Signage Lösung, maßgeschneidert für Ihre Branche.",
      categoryName: category.name,
      customerCity: customerCity || "Unknown",
      createdDate: new Date().toLocaleDateString("de-DE"),
      productGroupName: productVersion.product.productGroup.name,
      version: productVersion.version,
    }

    const htmlSlide = renderTemplate(template.htmlSlide, placeholders)
    const htmlWebsite = renderTemplate(template.htmlWebsite, placeholders)

    // Find the default design or any design as fallback for baseDesignId (required by schema)
    let baseDesignId = ""
    const anyDesign = await prisma.design.findFirst()
    if (anyDesign) baseDesignId = anyDesign.id

    const presentation = await prisma.presentation.create({
      data: {
        customerId: session.user.email,
        customerCity: customerCity || "Unknown",
        baseProductVersionId,
        baseCategoryId,
        baseDesignId,
        templateId: template.id,
        title: title || `Präsentation ${new Date().toLocaleDateString("de-DE")}`,
        slug: `pres-${Date.now()}`,
        htmlSlide,
        htmlWebsite,
        status: "DRAFT",
        presentationType: presentationType || "unbegleitet",
      },
    })

    return NextResponse.json(presentation, { status: 201 })
  } catch (error) {
    console.error("Error creating presentation:", error)
    return NextResponse.json(
      { error: "Failed to create presentation" },
      { status: 500 }
    )
  }
}

function renderTemplate(html: string, data: Record<string, string>): string {
  return html.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}
