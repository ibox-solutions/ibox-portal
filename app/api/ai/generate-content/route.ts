import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// ibox brand knowledge base — used to ground the AI
const IBOX_BRAND_CONTEXT = `
Du bist ein Experte für ibox solutions GmbH, ein österreichisches Digital-Signage-Unternehmen mit Sitz in Wien.

PRODUKTE:
- ibox.city: Multifunktionale Smart-City-Box. Kombiniert 43" Digital-Display (IP66, wetterfest), KI-Sensoren (Personenzählung, demographische Analyse), und integriertes Abfallmanagement. Vernetzt, solar-optional, DSGVO-konform, Daten auf Schweizer Servern. Für öffentliche Plätze, Gemeinden, Städte.
- ibox.board: Interaktives Touch-Display für den Innenbereich. 55"–98" Größen, 4K, Android/Windows, für Meetings, Info-Points, Retail.
- ibox.indoor: Digital Signage für Indoor-Anwendungen. Screens, Player, Content-Management.
- ibox.system: Komplette Digital-Signage-Infrastruktur. Hardware + Software + Content + Service aus einer Hand.

GESCHÄFTSMODELLE:
- CAPEX: Einmalkauf, Eigentum beim Kunden.
- OPEX: Monatliche Rate, Full-Service inklusive.
- Revenue Share: ibox investiert, Kunde teilt Werbeeinnahmen. 0 Investition für den Kunden.

USPs:
- Full-Service-Anbieter: Hardware, Software, Content, Service alles aus einer Hand.
- KI-Sensorik: Echtzeit-Besucherfrequenz, demografische Daten, Heatmaps.
- Datenschutz: DSGVO, Schweizer Server, keine Datenweitergabe.
- Nachhaltigkeit: Solar-Option, langlebige Hardware, Recycling.
- Lokal: Österreichisches Unternehmen, schneller Service, deutsche Kommunikation.

ZIELGRUPPEN & IHRE HAUPTARGUMENTE:
- Gemeinden/Städte: Moderne Stadtmöblierung, Bürgerinformation, Smart-City, kostenlos via Revenue Share.
- Einzelhandel/EKZ: Kundenfrequenz messen, Conversion steigern, dynamische Werbung, Umsatz steigern.
- Gastronomie: Digitale Speisekarten, Aktionen live ändern, Wartezeitengefühl reduzieren.
- Bahnhöfe/Flughäfen: Passagierinfo, Werbefläche vermarkten, Frequenzanalyse.
- Immobilien/Hausverwaltung: Digitale Beschilderung, Mieterinformation, Wertsteigerung.
- Agenturen: Werbeflächen für Kunden buchen, messbare Reichweite.

TONALITÄT:
- Professionell, direkt, lösungsorientiert.
- Keine Marketing-Floskeln.
- Konkrete Zahlen und Vorteile statt vager Versprechen.
- Auf Deutsch, Du-Form für interne Tools, Sie-Form für Kundenmaterialien.
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
      presentationType, // "begleitet" | "unbegleitet"
      contentType,      // "headline" | "subheadline" | "benefits" | "cta" | "full_slide" | "full_website"
      additionalContext,
    } = body

    if (!productName || !categoryName || !contentType) {
      return NextResponse.json(
        { error: "productName, categoryName und contentType sind erforderlich" },
        { status: 400 }
      )
    }

    const promptMap: Record<string, string> = {
      headline: `Schreibe eine prägnante Headline (max. 8 Wörter) für eine ${presentationType === "begleitet" ? "begleitete Sales-Präsentation" : "unbegleitete Kundenpräsentation (per Email versandt)"} für das Produkt "${productName}" an einen Kunden in der Branche "${categoryName}"${customerCity ? ` in ${customerCity}` : ""}. Nur die Headline, kein Kommentar.`,

      subheadline: `Schreibe einen Subheadline-Satz (max. 15 Wörter) als Ergänzung zur Headline für "${productName}" in der Branche "${categoryName}". Fokus auf den konkreten Nutzen. Nur den Satz, kein Kommentar.`,

      benefits: `Liste 3–5 konkrete Vorteile von "${productName}" speziell für die Branche "${categoryName}" auf. Jeder Vorteil: 1 kurze Zeile. Format: Bullet-Liste mit "•" als Zeichen. Keine Einleitung, nur die Liste.`,

      cta: `Schreibe einen Call-to-Action-Satz (max. 10 Wörter) für "${productName}" — für einen Kunden in der Branche "${categoryName}". Direkt, handlungsorientiert. Nur den CTA, kein Kommentar.`,

      full_slide: `Erstelle den kompletten Text-Content für eine ${presentationType === "begleitet" ? "begleitete Sales-Präsentation (minimal, visuell, wenig Text)" : "unbegleitete Präsentation (mehr Detail, selbsterklärend)"} für "${productName}" an einen Kunden in der Branche "${categoryName}"${customerCity ? ` in ${customerCity}` : ""}.

Ausgabe als JSON mit diesen Feldern (kein Markdown, nur das JSON-Objekt):
{
  "headline": "...",
  "subheadline": "...",
  "benefits": ["...", "...", "..."],
  "cta": "...",
  "intro": "...",
  "closing": "..."
}`,

      full_website: `Erstelle vollständigen HTML-Text-Content für eine Kunden-Landingpage für "${productName}" an einen Kunden in der Branche "${categoryName}"${customerCity ? ` in ${customerCity}` : ""}.

Ausgabe als JSON (kein Markdown, nur das JSON-Objekt):
{
  "heroHeadline": "...",
  "heroSubtext": "...",
  "section1Title": "...",
  "section1Text": "...",
  "benefits": [
    {"title": "...", "text": "..."},
    {"title": "...", "text": "..."},
    {"title": "...", "text": "..."}
  ],
  "section2Title": "...",
  "section2Text": "...",
  "ctaHeadline": "...",
  "ctaButton": "..."
}`,
    }

    const userPrompt = promptMap[contentType]
    if (!userPrompt) {
      return NextResponse.json(
        { error: `Unbekannter contentType: ${contentType}` },
        { status: 400 }
      )
    }

    const fullPrompt = additionalContext
      ? `${userPrompt}\n\nZusätzlicher Kontext: ${additionalContext}`
      : userPrompt

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        system: IBOX_BRAND_CONTEXT,
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
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

    // For JSON content types, parse and return structured data
    if (contentType === "full_slide" || contentType === "full_website") {
      try {
        const clean = rawText.replace(/```json|```/g, "").trim()
        const parsed = JSON.parse(clean)
        return NextResponse.json({ content: parsed, raw: rawText, contentType })
      } catch {
        // Fallback: return raw text
        return NextResponse.json({ content: rawText, raw: rawText, contentType })
      }
    }

    return NextResponse.json({ content: rawText.trim(), contentType })
  } catch (error) {
    console.error("Error in AI generate:", error)
    return NextResponse.json(
      { error: "Interner Fehler" },
      { status: 500 }
    )
  }
}
