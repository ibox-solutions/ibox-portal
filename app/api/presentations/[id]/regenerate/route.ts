import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const IBOX_SYSTEM_PROMPT = `Du bist ein erfahrener Texter und Designer für ibox solutions GmbH & Co KG, ein österreichisches Unternehmen das multifunktionale Smart-City-Boxen entwickelt und vertreibt.

## UNTERNEHMENS-IDENTITÄT
- CEO: Alexander Frank (Magister iuris, Master of Business Law)
- Standort: Saaz 102/3, 8341 Paldau / Wien, Österreich
- Kontakt: frank@ibox.eu.com / +43 664 911 24 63
- FN 650835k (LGZ Graz) | ATU82170589
- Auszeichnungen: Made in Austria, EUIPO, Zero Project 2026

## KERNBOTSCHAFT
Die ibox ist KEIN Display. Sie ist ein Problemloser.
Die ibox ist KEIN Mülleimer mit Bildschirm. Sie ist ein multifunktionales Infrastruktur-Element.

## PRODUKTE

### ibox.city
3-in-1 Smart City Box:
1. **Digital Signage** — 43" Outdoor-Display, 4K, IP66, 24/7, DSGVO-konform, Schweizer Server
2. **Designer-Abfallbehälter** — geruchsdicht, integrierter Aschenbecher, wartungsarm
3. **KI-Sensorik** — anonyme Personenzählung, Demografie-Analyse, Heatmaps, Edge-AI (keine personenbezogenen Daten)

Technisch: Pulverbeschichteter Stahl & Sicherheitsglas, vandalensicher, wetterfest, CI-konform (alle RAL-Farben), barrierefrei (EU BFSG-konform), Solar-Option, 4G/LAN

### ibox.board
Interaktives Touch-Display für Indoor. 55"–98", 4K, Android/Windows. Für Meetings, Info-Points, Retail, Bildung.

### ibox.indoor  
Digital Signage Indoor. Screens, Player, Content-Management.

### ibox.system
Komplette Digital-Signage-Infrastruktur. Hardware + Software + Content + Service aus einer Hand.

## GESCHÄFTSMODELLE

**CAPEX (Kauf):** Einmalinvestition, Eigentum beim Kunden
**OPEX (Miete):** Monatliche Rate ab 399€/Monat, Full-Service inklusive, sofort steuerlich absetzbar
**Revenue Share:** ibox investiert komplett, Kunde teilt Werbeeinnahmen. 0€ Investition, 0€ Risiko.

Kostenvergleich 5 Jahre (ibox.city):
- Stele klassisch: Anschaffung ~14.500€ + Wartung 5.940€ + Reinigung 2.980€ = ~23.420€
- ibox OPEX: 399€ × 60 = 23.940€ — aber INKL. allem, OHNE Baustelle, MIT KI-Sensorik

## ZIELGRUPPEN & IHRE ARGUMENTE

### Städte & Gemeinden
- Modernes Stadtbild ohne Investition (Revenue Share)
- Bürgerinformation digital & aktuell
- Smart City ohne IT-Aufwand
- Barrierefreiheit erfüllt (EU-Pflicht seit 2025)
- Keine Baumaßnahmen nötig

### Einzelhandel / Supermärkte (z.B. REWE/BILLA)
- Besucherfrequenz messen (ohne Kamera, DSGVO-konform)
- One-to-One Marketing: Werbung passt sich Zielgruppe VOR ORT an
- Dynamische Inhalte: Aktionen live ändern
- Service Fee Modell: 100% Werbeeinnahmen für den Kunden
- Messbarer ROI statt Streuverlust

### Gastronomie
- Digitale Speise- & Getränkekarte
- Aktionen in Echtzeit ändern
- Wartezeitgefühl reduzieren
- Outdoor-Werbung für Laufkundschaft

### Bahnhöfe & Flughäfen
- Passagierinfo + Werbung kombiniert
- Frequenzanalyse für Standortentscheidungen
- Revenue aus Werbeflächenvermarktung
- Vandalensichere Outdoor-Lösung

### Banken & Sparkassen
- Außenbereich modernisieren ohne Bauaufwand
- Kundenansprache am POS
- Barrierefreiheit (EU-Gesetz)
- Filialmarketing automatisiert

### Agenturen & Medienunternehmen
- Neue Werbefläche für Kunden erschließen
- Messbare Reichweite (Personenzählung)
- Full-Service — kein eigenes Know-how nötig

## ARGUMENTATIONSSTRUKTUR (Präsentationsaufbau)
1. Problem/Herausforderung des Kunden benennen
2. Bisherige Lösungen & deren Schwächen
3. ibox als Lösung einführen
4. Konkrete Vorteile für diese Branche
5. Business Model (passend zur Zielgruppe)
6. Der Aha-Effekt: echte Zahlen & Vergleich
7. Nächste Schritte / Call to Action

## TONALITÄT
- Professionell, direkt, lösungsorientiert
- Keine leeren Marketing-Phrasen
- Konkrete Zahlen wo möglich
- "Die ibox ist kein X, sie ist ein Y" (Umformulierungsstrategie)
- Kurze, klare Sätze
- Sie-Form für Kundenmaterialien

## BRAND DESIGN
- Primärfarbe: #309E3B (ibox Grün)
- Dunkel: #1A1A1A
- Hintergrund: #F5F5F5 oder Weiß
- Akzent hell: #E8F5E9
- Stil: Minimalistisch, Swiss Design, viel Weißraum, klare Hierarchie
- KEIN Bling, keine Farborgien, keine generischen Stock-Photo-Ästhetik

Antworte NUR mit einem JSON-Objekt, kein Markdown, keine Erklärung:
{"htmlSlide": "<!DOCTYPE html>...", "htmlWebsite": "<!DOCTYPE html>..."}
`

function buildPrompt(params: {
  productName: string
  productDescription: string
  categoryName: string
  customerCity: string
  customerName?: string
  customerWebsite?: string
  additionalInfo?: string
  presentationType: string
  productGroupName: string
}): string {
  const { productName, productDescription, categoryName, customerCity, customerName, customerWebsite, additionalInfo, presentationType, productGroupName } = params

  const typeInstructions = presentationType === "begleitet"
    ? `BEGLEITET (Pitch mit Sprecher): Minimal, visuell stark, wenig Text. Große Headlines, max. 4 Bullet-Points pro Seite, viel Weißraum. Der Sprecher erklärt — die Folie unterstreicht nur.`
    : `UNBEGLEITET (per Email versandt): Selbsterklärend, detaillierter, aber trotzdem klar strukturiert. Jeder Abschnitt muss ohne Sprecher verständlich sein.`

  return `Erstelle zwei HTML-Präsentationen für:

**Produkt:** ${productName} (Gruppe: ${productGroupName})
**Produktbeschreibung:** ${productDescription}
**Zielbranche:** ${categoryName}
${customerName ? `**Kundenname:** ${customerName}` : ""}
${customerCity ? `**Kundenstadt:** ${customerCity}` : ""}
${customerWebsite ? `**Kunden-Website:** ${customerWebsite} (analysiere die CI, Farben und Sprache für den Stil)` : ""}
${additionalInfo ? `**Zusatzinfo vom Vertrieb:** ${additionalInfo}` : ""}
**Präsentationstyp:** ${typeInstructions}

**htmlSlide** — Eine Präsentationsfolie (A4, Hochformat oder 16:9):
- Headline: Spezifisch für ${categoryName}${customerName ? ` / ${customerName}` : ""}, nicht generisch
- Subheadline: Konkreter Kundennutzen für diese Branche
- 3-4 Bullet-Points: Die stärksten Argumente für ${categoryName}
- Business Model Hinweis: passend (Revenue Share wenn Gemeinde/Stadt, OPEX für Retail, etc.)
- Footer: ibox solutions | frank@ibox.eu.com
- Design: ibox Brand (#309E3B, #1A1A1A, clean, minimal)
- Print-optimiert: @media print

**htmlWebsite** — Vollständige Landingpage:
- Hero: Starke Headline + Subtext, spezifisch für ${categoryName}${customerName ? ` — angesprochen an ${customerName}` : ""}
- Problem-Sektion: Was ${categoryName}-Kunden heute haben und was fehlt
- Lösung: ${productName} als Antwort, konkrete Features
- 3-4 Benefits mit Icons (Emoji), branchen-spezifisch
- Business Model Box: Passende Option hervorgehoben
- Der Aha-Effekt: Kostenvergleich oder Zahlen die überzeugen
- CTA: Konkret, nicht generisch ("Demo-Termin anfragen" o.ä.)
- Footer: Alle Firmendaten

Nutze das echte ibox-Wissen aus dem System-Prompt. Keine generischen Texte.`
}

async function generateTemplates(params: {
  productName: string
  productDescription: string
  categoryName: string
  customerCity: string
  customerName?: string
  customerWebsite?: string
  additionalInfo?: string
  presentationType: string
  productGroupName: string
}): Promise<{ htmlSlide: string; htmlWebsite: string }> {
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
      system: IBOX_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(params) }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${await response.text()}`)
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
      { error: "ANTHROPIC_API_KEY nicht konfiguriert." },
      { status: 503 }
    )
  }

  try {
    const { id } = await params

    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        baseProductVersion: {
          include: { product: { include: { productGroup: true } } },
        },
        baseCategory: true,
      },
    })

    if (!presentation) {
      return NextResponse.json({ error: "Präsentation nicht gefunden" }, { status: 404 })
    }

    const productName = (presentation as any).customProductText || presentation.baseProductVersion.product.name
    const productDescription = (presentation as any).customProductText || presentation.baseProductVersion.product.description || productName
    const categoryName = presentation.baseCategory.name
    const customerCity = presentation.customerCity || ""
    const customerName = (presentation as any).customerName || ""
    const customerWebsite = (presentation as any).customerWebsite || ""
    const additionalInfo = (presentation as any).additionalInfo || ""
    const presentationType = presentation.presentationType
    const productGroupName = (presentation as any).customProductText ? "ibox" : presentation.baseProductVersion.product.productGroup.name
    const version = (presentation as any).customProductText ? "Custom" : presentation.baseProductVersion.version

    // Merge with overrides from request body
    let reqBody: any = {}
    try { reqBody = await req.json() } catch {}

    const { htmlSlide, htmlWebsite } = await generateTemplates({
      productName: reqBody.customProductText || productName,
      productDescription: reqBody.customProductText || productDescription,
      categoryName,
      customerCity,
      customerName: reqBody.customerName || customerName,
      customerWebsite: reqBody.customerWebsite || customerWebsite,
      additionalInfo: reqBody.additionalInfo || additionalInfo,
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

    const updated = await prisma.presentation.update({
      where: { id },
      data: {
        htmlSlide: renderPlaceholders(htmlSlide, placeholders),
        htmlWebsite: renderPlaceholders(htmlWebsite, placeholders),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, presentation: updated })
  } catch (error: any) {
    console.error("Regenerate error:", error)
    if (error.message?.includes("JSON")) {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden. Bitte nochmal versuchen." }, { status: 422 })
    }
    return NextResponse.json({ error: "Interner Fehler: " + error.message }, { status: 500 })
  }
}
