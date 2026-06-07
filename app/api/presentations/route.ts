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
    const productVersionId = searchParams.get("productVersionId")
    const categoryId = searchParams.get("categoryId")
    const status = searchParams.get("status")

    const where: any = {}
    if (productVersionId) where.baseProductVersionId = productVersionId
    if (categoryId) where.baseCategoryId = categoryId
    if (status) where.status = status

    const presentations = await prisma.presentation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        baseProductVersion: {
          include: { product: { include: { productGroup: true } } },
        },
        baseCategory: true,
      },
    })

    return NextResponse.json(presentations)
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
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
      baseProductVersionId, baseCategoryId, templateId, presentationType, 
      customerCity, customerName, customerWebsite, additionalInfo, 
      customProductText, title 
    } = body

    if (!baseCategoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Custom product mode — find any active product version as placeholder
    let resolvedProductVersionId = baseProductVersionId
    if (!resolvedProductVersionId && customProductText) {
      const anyVersion = await prisma.productVersion.findFirst({
        where: { isActive: true },
        include: { product: { include: { productGroup: true } } },
      })
      if (!anyVersion) {
        return NextResponse.json({ error: "Kein aktives Produkt gefunden. Bitte zuerst Produkte anlegen." }, { status: 400 })
      }
      resolvedProductVersionId = anyVersion.id
    }

    if (!resolvedProductVersionId) {
      return NextResponse.json({ error: "Produkt oder Custom-Text erforderlich" }, { status: 400 })
    }

    const [productVersion, category] = await Promise.all([
      prisma.productVersion.findUnique({
        where: { id: resolvedProductVersionId },
        include: { product: { include: { productGroup: true } } },
      }),
      prisma.industryCategory.findUnique({ where: { id: baseCategoryId } }),
    ])

    if (!productVersion || !category) {
      return NextResponse.json({ error: "Invalid product or category" }, { status: 400 })
    }

    let template = null
    if (templateId) template = await prisma.template.findUnique({ where: { id: templateId } })
    if (!template) {
      template = await prisma.template.findFirst({
        where: { productGroupId: productVersion.product.productGroupId, isStandard: true },
      })
    }
    if (!template || !template.isActive) {
      return NextResponse.json({ error: "Kein aktives Template gefunden" }, { status: 400 })
    }

    const placeholders = {
      productName: productVersion.product.name,
      productDescription: productVersion.product.description || "Digital Signage Lösung von ibox solutions.",
      categoryName: category.name,
      customerCity: customerCity || "Unknown",
      createdDate: new Date().toLocaleDateString("de-DE"),
      productGroupName: productVersion.product.productGroup.name,
      version: productVersion.version,
    }

    const renderTemplate = (html: string) =>
      html.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) =>
        placeholders[key as keyof typeof placeholders] ?? match
      )

    const anyDesign = await prisma.design.findFirst()
    const baseDesignId = anyDesign?.id || ""

    const presentation = await prisma.presentation.create({
      data: {
        customerId: session.user.email,
        customerCity: customerCity || customerName || "Unbekannt",
        customerName: customerName || undefined,
        customerWebsite: customerWebsite || undefined,
        additionalInfo: additionalInfo || undefined,
        customProductText: customProductText || undefined,
        baseProductVersionId: resolvedProductVersionId,
        baseCategoryId,
        baseDesignId,
        templateId: template.id,
        title: title || (customerName ? `${customerName} Präsentation` : `ibox Präsentation ${new Date().toLocaleDateString("de-DE")}`),
        slug: `pres-${Date.now()}`,
        htmlSlide: renderTemplate(template.htmlSlide),
        htmlWebsite: renderTemplate(template.htmlWebsite),
        status: "DRAFT",
        presentationType: presentationType || "unbegleitet",
      },
    })

    return NextResponse.json(presentation, { status: 201 })
  } catch (error) {
    console.error("Error creating presentation:", error)
    return NextResponse.json({ error: "Failed to create presentation" }, { status: 500 })
  }
}
