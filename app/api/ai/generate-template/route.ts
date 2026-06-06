import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const IBOX_TEMPLATE_SYSTEM = `
Du bist ein Experte für ibox solutions und erstellst professionelle HTML-Präsentationen.

IBOX BRAND IDENTITY:
- Primärfarbe: #309E3B (ibox Grün)
- Sekundär: #1A1A1A (fast schwarz)
- Hintergrund: #F5F5F5 (hellgrau) oder weiß
- Akzent: #E8F5E9 (sehr helles grün)
- Schriften: System-Stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Stil: Minimalistisch, clean, professionell. Kein Bling, keine Farborgien.

TECHNISCHE ANFORDERUNGEN:
- Reines HTML + CSS (kein JavaScript, kein externe Ressourcen)
- Alle Stile inline oder im <style>-Tag
- Optimiert für A4 @print (für PDF-Druck)
- Responsive für Desktop-Browser
- Verwende Platzhalter: {{productName}}, {{categoryName}}, {{customerCity}}, {{createdDate}}, {{productGroupName}}, {{version}}, {{productDescription}}

SLIDE-FORMAT (htmlSlide):
- Kompakt, eine Seite, wie eine Präsentationsfolie
- Viel Weißraum
- Große Headlines
- Maximal 3–5 Bullet Points
- Print-optimiert: @media print { ... }

WEBSITE-FORMAT (htmlWebsite):
- Mehrere Sektionen, scrollbar
- Hero-Bereich oben
- Features/Benefits Sektion
- Kontakt/CTA am Ende
- Professionell wie eine Landingpage

Antworte NUR mit einem JSON-Objekt, kein Markdown, keine Erklärung:
{
  "htmlSlide": "<!DOCTYPE html>...",
  "htmlWebsite": "<!DOCTYPE html>..."
}
`

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      productName,
      productDescription,
      categoryName,
      customerCity,
      presentationType,
      productGroupName,
    } = body

    if (!productName || !categoryName) {
      return NextResponse.json(
        { error: "productName und categoryName erforderlich" },
        { status: 400 }
      )
    }

    const userPrompt = `Erstelle zwei HTML-Templates (Slide + Website) für:
- Produkt: ${productName}
- Beschreibung: ${productDescription || "Digital Signage Lösung von ibox solutions"}
- Branche: ${categoryName}
- Kundenstadt: ${customerCity || "nicht angegeben"}
- Präsentationstyp: ${presentationType === "begleitet" ? "Begleitet (minimal, visuell)" : "Unbegleitet (detailliert, selbsterklärend)"}
- Produktgruppe: ${productGroupName || "ibox"}

Verwende die ibox Markenfarben und -stil. Platzhalter {{productName}} etc. einbauen.
Antworte nur mit dem JSON-Objekt.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: IBOX_TEMPLATE_SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Anthropic API error:", err)
      return NextResponse.json(
        { error: "AI-Service nicht verfügbar" },
        { status: 502 }
      )
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ""

    try {
      const clean = rawText.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)

      if (!parsed.htmlSlide || !parsed.htmlWebsite) {
        throw new Error("Missing template fields")
      }

      return NextResponse.json({
        htmlSlide: parsed.htmlSlide,
        htmlWebsite: parsed.htmlWebsite,
      })
    } catch (parseError) {
      console.error("Failed to parse AI template response:", parseError)
      return NextResponse.json(
        { error: "AI hat kein gültiges Template zurückgegeben. Bitte nochmal versuchen." },
        { status: 422 }
      )
    }
  } catch (error) {
    console.error("Error in AI generate-template:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
