import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const IBOX_TEMPLATE_SYSTEM = `
Du bist ein Experte für ibox solutions GmbH, ein österreichisches Digital-Signage-Unternehmen.

PRODUKTE & USPs:
- ibox.city: Multifunktionale Smart-City-Box. 43" Display (IP66), KI-Sensoren, Abfallmanagement. Für Gemeinden, Städte, öffentliche Plätze.
- ibox.board: Interaktives Touch-Display Indoor. 55"–98", 4K, für Meetings, Info-Points, Retail.
- ibox.indoor: Digital Signage Indoor. Screens, Player, Content-Management.
- ibox.system: Komplette Infrastruktur. Hardware + Software + Content + Service aus einer Hand.

GESCHÄFTSMODELLE: CAPEX (Kauf), OPEX (Miete/Full-Service), Revenue Share (0 Investition).
DATENSCHUTZ: DSGVO-konform, Schweizer Server.
TONALITÄT: Professionell, direkt, keine Floskeln, konkrete Vorteile.

IBOX BRAND:
- Primärfarbe: #309E3B (grün)
- Dunkel: #1A1A1A
- Hintergrund: #F5F5F5
- Stil: Minimalistisch, clean, Swiss-Design

Erstelle zwei HTML-Dokumente. Antworte NUR mit einem JSON-Objekt, kein Markdown:
{
  "htmlSlide": "<!DOCTYPE html>...",
  "htmlWebsite": "<!DOCTYPE html>..."
}

htmlSlide: Kompakte Präsentationsfolie. 100vh, zentriert, große Headline, max. 5 Bullets, print-optimiert.
htmlWebsite: Vollständige Landingpage. Hero, Features/Benefits, CTA-Sektion, Footer. Scrollbar, professionell.
Beide: Platzhalter {{productName}}, {{categoryName}}, {{customerCity}}, {{createdDate}}, {{productGroupName}}, {{version}}, {{productDescription}} einbauen.
`

async function generateTemplates(params: {
  productName: string
  productDescription: string
  categoryName: string
  customerCity: string
  presentationType: string
  productGroupName: string
}): Promise<{ htmlSlide: string; htmlWebsite: string }> {
  const { productName, productDescription, categoryName, customerCity, presentationType, productGroupName } = params

  const userPrompt = `Erstelle zwei HTML-Templates für:
- Produkt: ${productName}
- Beschreibung: ${productDescription}
- Branche: ${categoryName}
- Kundenstadt: ${customerCity || "nicht angegeben"}
- Präsentationstyp: ${presentationType === "begleitet" ? "Begleitet (minimal, visuell, wenig Text)" : "Unbegleitet (detailliert, selbsterklärend)"}
- Produktgruppe: ${productGroupName}

Antworte nur mit dem JSON-Objekt, kein Markdown.`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: IBOX_TEMPLATE_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${err}`)
  }

  const data = await response.json()
  const rawText = data.content?.[0]?.text || ""
  const clean = rawText.replace(/```json|```/g, "").trim()
  const parsed = JSON.parse(clean)

  if (!parsed.htmlSlide || !parsed.htmlWebsite) {
    throw new Error("AI returned incomplete template data")
  }

  return { htmlSlide: parsed.htmlSlide, htmlWebsite: parsed.htmlWebsite }
}

function renderPlaceholders(html: string, data: Record<string, string>): string {
  return html.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) =>
    data[key] !== undefined ? String(data[key]) : match
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY ist nicht konfiguriert. Bitte in den Vercel Environment Variables eintragen." },
      { status: 503 }
    )
  }

  try {
    const { id } = await params

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
      return NextResponse.json({ error: "Präsentation nicht gefunden" }, { status: 404 })
    }

    const productName = presentation.baseProductVersion.product.name
    const productDescription =
      presentation.baseProductVersion.product.description ||
      "Hochwertige Digital Signage Lösung von ibox solutions"
    const categoryName = presentation.baseCategory.name
    const customerCity = presentation.customerCity || ""
    const presentationType = presentation.presentationType
    const productGroupName = presentation.baseProductVersion.product.productGroup.name
    const version = presentation.baseProductVersion.version

    // Direct function call — no internal HTTP fetch
    const { htmlSlide, htmlWebsite } = await generateTemplates({
      productName,
      productDescription,
      categoryName,
      customerCity,
      presentationType,
      productGroupName,
    })

    const placeholders: Record<string, string> = {
      productName,
      productDescription,
      categoryName,
      customerCity,
      createdDate: new Date().toLocaleDateString("de-DE"),
      productGroupName,
      version,
    }

    const updatedPresentation = await prisma.presentation.update({
      where: { id },
      data: {
        htmlSlide: renderPlaceholders(htmlSlide, placeholders),
        htmlWebsite: renderPlaceholders(htmlWebsite, placeholders),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, presentation: updatedPresentation })
  } catch (error: any) {
    console.error("Regenerate error:", error)

    if (error.message?.includes("JSON")) {
      return NextResponse.json(
        { error: "KI hat kein gültiges Template zurückgegeben. Bitte nochmal versuchen." },
        { status: 422 }
      )
    }

    return NextResponse.json({ error: "Interner Fehler: " + error.message }, { status: 500 })
  }
}
