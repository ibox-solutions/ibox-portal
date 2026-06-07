import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET — load slides
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    select: { id: true, title: true, slidesData: true, editorMode: true, htmlSlide: true, htmlWebsite: true },
  })
  if (!presentation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(presentation)
}

// PUT — save slides + regenerate HTML
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { slidesData, editorMode } = await req.json()

  // Generate HTML from slides
  const htmlSlide = generateSlidesHTML(slidesData, editorMode)
  const htmlWebsite = generateWebsiteHTML(slidesData, editorMode)

  const updated = await prisma.presentation.update({
    where: { id },
    data: {
      slidesData,
      editorMode,
      htmlSlide,
      htmlWebsite,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, htmlSlide, htmlWebsite })
}

// ─── HTML Generators ──────────────────────────────────────────────────────────

function generateSlidesHTML(slides: any[], mode: string): string {
  if (!slides || slides.length === 0) return "<p>Keine Folien</p>"

  const slidePages = slides.map((slide, i) => {
    if (mode === "slides") return renderSlide(slide, i)
    return renderSection(slide, i)
  }).join("")

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F5F5; }
  .slide-page {
    width: 297mm; min-height: 210mm;
    background: white; margin: 0 auto 20px;
    display: flex; flex-direction: column;
    page-break-after: always; overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .section-page {
    width: 297mm; background: white;
    margin: 0 auto 20px; padding: 40px 60px;
    page-break-after: always;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  @media print {
    body { background: white; }
    .slide-page, .section-page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
${slidePages}
</body>
</html>`
}

function generateWebsiteHTML(slides: any[], mode: string): string {
  if (!slides || slides.length === 0) return "<p>Keine Inhalte</p>"

  const sections = slides.map((slide) => renderWebSection(slide)).join("")

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1A1A1A; }
  .section { padding: 60px 80px; }
  .section:nth-child(even) { background: #F9F9F9; }
  .hero { background: #1A1A1A; color: white; padding: 80px; }
  .hero h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; }
  .hero p { font-size: 1.1rem; color: #9B9B9B; max-width: 600px; }
  h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; }
  h3 { font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #309E3B; }
  p { font-size: 1rem; line-height: 1.7; color: #444; margin-bottom: 12px; }
  ul { list-style: none; margin: 16px 0; }
  ul li { padding: 8px 0; padding-left: 24px; position: relative; font-size: 0.95rem; }
  ul li:before { content: "→"; position: absolute; left: 0; color: #309E3B; font-weight: bold; }
  .cta-section { background: #309E3B; color: white; text-align: center; padding: 80px; }
  .cta-section h2 { color: white; }
  .cta-btn { display: inline-block; background: white; color: #309E3B; font-weight: 700;
    padding: 16px 40px; border-radius: 8px; margin-top: 24px; font-size: 1rem; text-decoration: none; }
  .footer { background: #1A1A1A; color: #9B9B9B; padding: 40px 80px; font-size: 0.85rem; }
</style>
</head>
<body>
${sections}
</body>
</html>`
}

function renderSlide(slide: any, index: number): string {
  const bg = slide.backgroundColor || (slide.type === "cover" ? "#1A1A1A" : "white")
  const textColor = slide.backgroundColor === "#1A1A1A" || slide.type === "cover" ? "white" : "#1A1A1A"
  const accentColor = "#309E3B"

  const bullets = (slide.bullets || []).map((b: string) =>
    `<li style="padding: 6px 0; padding-left: 20px; position: relative; font-size: 14px; color: ${textColor === "white" ? "#ccc" : "#444"}">
      <span style="position: absolute; left: 0; color: ${accentColor}; font-weight: bold;">→</span>${b}
    </li>`
  ).join("")

  return `<div class="slide-page" style="background: ${bg}; padding: 50px 60px; justify-content: ${slide.type === "cover" ? "center" : "flex-start"}; align-items: ${slide.type === "cover" ? "center" : "flex-start"}; text-align: ${slide.type === "cover" ? "center" : "left"};">
    ${slide.label ? `<div style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: ${accentColor}; margin-bottom: 16px;">${slide.label}</div>` : ""}
    ${slide.headline ? `<h1 style="font-size: ${slide.type === "cover" ? "2.8rem" : "2rem"}; font-weight: 800; color: ${textColor}; line-height: 1.15; margin-bottom: 16px; max-width: 800px;">${slide.headline}</h1>` : ""}
    ${slide.subheadline ? `<p style="font-size: 1.1rem; color: ${textColor === "white" ? "#9B9B9B" : "#555"}; margin-bottom: 24px; max-width: 600px;">${slide.subheadline}</p>` : ""}
    ${slide.text ? `<p style="font-size: 14px; color: ${textColor === "white" ? "#aaa" : "#555"}; line-height: 1.7; max-width: 700px; margin-bottom: 20px;">${slide.text}</p>` : ""}
    ${bullets ? `<ul style="list-style: none; margin-top: 16px;">${bullets}</ul>` : ""}
    ${slide.type === "cta" ? `<div style="margin-top: 32px; display: inline-block; background: ${accentColor}; color: white; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px;">${slide.ctaText || "Jetzt Kontakt aufnehmen"}</div>` : ""}
    <div style="position: absolute; bottom: 20px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 10px; color: ${textColor === "white" ? "#555" : "#bbb"};">
      <span>ibox solutions GmbH | frank@ibox.eu.com</span>
      <span>${index + 1}</span>
    </div>
  </div>`
}

function renderSection(slide: any, index: number): string {
  const bullets = (slide.bullets || []).map((b: string) =>
    `<li style="padding: 6px 0; padding-left: 20px; position: relative;">
      <span style="position: absolute; left: 0; color: #309E3B; font-weight: bold;">→</span>${b}
    </li>`
  ).join("")

  return `<div class="section-page">
    ${slide.label ? `<div style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #309E3B; margin-bottom: 12px;">${slide.label}</div>` : ""}
    ${slide.headline ? `<h2 style="font-size: 1.8rem; font-weight: 800; color: #1A1A1A; margin-bottom: 12px;">${slide.headline}</h2>` : ""}
    ${slide.subheadline ? `<p style="font-size: 1rem; color: #555; margin-bottom: 20px; font-style: italic;">${slide.subheadline}</p>` : ""}
    ${slide.text ? `<p style="font-size: 14px; color: #444; line-height: 1.8; margin-bottom: 16px;">${slide.text}</p>` : ""}
    ${bullets ? `<ul style="list-style: none; margin-top: 12px;">${bullets}</ul>` : ""}
  </div>`
}

function renderWebSection(slide: any): string {
  const isHero = slide.type === "cover"
  const isCTA = slide.type === "cta"
  const bullets = (slide.bullets || []).map((b: string) => `<li>${b}</li>`).join("")

  if (isHero) return `<div class="hero">
    ${slide.label ? `<div style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #309E3B; margin-bottom: 12px;">${slide.label}</div>` : ""}
    <h1>${slide.headline || ""}</h1>
    ${slide.subheadline ? `<p>${slide.subheadline}</p>` : ""}
  </div>`

  if (isCTA) return `<div class="cta-section">
    <h2>${slide.headline || "Jetzt starten"}</h2>
    ${slide.text ? `<p style="color: rgba(255,255,255,0.8); margin-top: 12px;">${slide.text}</p>` : ""}
    <a href="mailto:frank@ibox.eu.com" class="cta-btn">${slide.ctaText || "Kontakt aufnehmen"}</a>
  </div>`

  return `<div class="section">
    ${slide.label ? `<h3>${slide.label}</h3>` : ""}
    ${slide.headline ? `<h2>${slide.headline}</h2>` : ""}
    ${slide.subheadline ? `<p style="color: #777; margin-bottom: 16px; font-style: italic;">${slide.subheadline}</p>` : ""}
    ${slide.text ? `<p>${slide.text}</p>` : ""}
    ${bullets ? `<ul>${bullets}</ul>` : ""}
  </div>`
}
