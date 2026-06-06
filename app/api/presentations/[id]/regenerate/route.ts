import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    // Load presentation with all relations
    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        baseProductVersion: {
          include: {
            product: {
              include: { productGroup: true },
            },
          },
        },
        baseCategory: true,
        template: true,
      },
    })

    if (!presentation) {
      return NextResponse.json({ error: "Presentation not found" }, { status: 404 })
    }

    const productName = presentation.baseProductVersion.product.name
    const productDescription =
      presentation.baseProductVersion.product.description ||
      "Hochwertige Digital Signage Lösung von ibox solutions"
    const categoryName = presentation.baseCategory.name
    const customerCity = presentation.customerCity
    const presentationType = presentation.presentationType
    const productGroupName = presentation.baseProductVersion.product.productGroup.name
    const version = presentation.baseProductVersion.version

    // Call our own AI generate-template endpoint
    const baseUrl = req.nextUrl.origin
    const aiRes = await fetch(`${baseUrl}/api/ai/generate-template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the session cookie
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        productName,
        productDescription,
        categoryName,
        customerCity,
        presentationType,
        productGroupName,
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.json()
      return NextResponse.json(
        { error: err.error || "AI-Generierung fehlgeschlagen" },
        { status: aiRes.status }
      )
    }

    const { htmlSlide, htmlWebsite } = await aiRes.json()

    // Replace placeholders
    const placeholders = {
      productName,
      productDescription,
      categoryName,
      customerCity,
      createdDate: new Date().toLocaleDateString("de-DE"),
      productGroupName,
      version,
    }

    const renderTemplate = (html: string): string =>
      html.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) =>
        placeholders[key as keyof typeof placeholders] !== undefined
          ? String(placeholders[key as keyof typeof placeholders])
          : match
      )

    const updatedPresentation = await prisma.presentation.update({
      where: { id },
      data: {
        htmlSlide: renderTemplate(htmlSlide),
        htmlWebsite: renderTemplate(htmlWebsite),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      presentation: updatedPresentation,
    })
  } catch (error) {
    console.error("Error regenerating presentation:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
