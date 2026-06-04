import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

/**
 * POST /api/admin/templates/[id]/preview?variant=slide|website
 * 
 * Renders a template with mock data and returns the rendered HTML.
 * 
 * - If id === "draft", uses htmlSlide/htmlWebsite from body (for unsaved edits)
 * - Otherwise loads template from DB by id
 * 
 * Body can override mock data fields.
 */
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
    const { searchParams } = new URL(req.url)
    const variant = searchParams.get("variant") || "slide"
    const body = await req.json().catch(() => ({} as any))

    let htmlSource: string

    if (id === "draft") {
      htmlSource = variant === "website" ? (body.htmlWebsite || "") : (body.htmlSlide || "")
    } else {
      const template = await prisma.template.findUnique({
        where: { id },
      })
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      htmlSource = variant === "website" ? template.htmlWebsite : template.htmlSlide
    }

    const mockData = {
      productName: body.productName || "iboard Pro 65",
      productDescription:
        body.productDescription ||
        "Eine moderne 65 Zoll Touchscreen Lösung für interaktive Kommunikation im professionellen Umfeld.",
      categoryName: body.categoryName || "Gastronomie",
      customerCity: body.customerCity || "Wien",
      createdDate: body.createdDate || new Date().toLocaleDateString("de-DE"),
      productGroupName: body.productGroupName || "iboard",
      designName: body.designName || "Standard",
      version: body.version || "v2.5",
    }

    const rendered = renderTemplate(htmlSource, mockData)

    return new NextResponse(rendered, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    console.error("Error rendering preview:", error)
    return NextResponse.json(
      { error: "Failed to render preview" },
      { status: 500 }
    )
  }
}

function renderTemplate(html: string, data: Record<string, string>): string {
  return html.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}
