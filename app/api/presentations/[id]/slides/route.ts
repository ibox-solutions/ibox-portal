import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { slidesData, editorMode } = await req.json()
  const htmlSlide = generateSlidesHTML(slidesData, editorMode)
  const htmlWebsite = generateWebsiteHTML(slidesData)
  await prisma.presentation.update({
    where: { id },
    data: { slidesData, editorMode, htmlSlide, htmlWebsite, updatedAt: new Date() },
  })
  return NextResponse.json({ success: true, htmlSlide, htmlWebsite })
}

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
`

const BASE_STYLES = `
  ${FONTS}
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --green: #309E3B;
    --green-light: #E8F5E9;
    --dark: #0F0F0F;
    --mid: #6B6B6B;
    --light: #F5F5F5;
    --white: #FFFFFF;
    --serif: 'DM Serif Display', Georgia, serif;
    --sans: 'DM Sans', -apple-system, sans-serif;
  }
  body {
    font-family: var(--sans);
    background: #EBEBEB;
    color: var(--dark);
    -webkit-font-smoothing: antialiased;
  }
`

const SLIDE_BASE_STYLES = `
  ${BASE_STYLES}
  .slide {
    width: 297mm;
    height: 210mm;
    background: var(--white);
    position: relative;
    overflow: hidden;
    page-break-after: always;
    margin: 0 auto 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  }
  @media print {
    body { background: white; }
    .slide { margin: 0; box-shadow: none; }
  }
  /* Accent bar — always present */
  .slide::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: var(--green);
  }
  /* Bottom bar */
  .slide-footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 44px;
    border-top: 1px solid #EBEBEB;
    font-size: 9px;
    letter-spacing: 0.08em;
    color: #BDBDBD;
    font-family: var(--sans);
    font-weight: 500;
    text-transform: uppercase;
  }
  .slide-footer .dot { color: var(--green); margin: 0 6px; }
`

// ─── SLIDE RENDERERS ──────────────────────────────────────────────────────────

function renderCover(slide: any, index: number, total: number): string {
  return `
  <div class="slide" style="background: var(--dark);">
    <!-- Decorative green rectangle -->
    <div style="position:absolute;top:0;left:0;right:0;height:4px;background:var(--green)"></div>
    <div style="position:absolute;bottom:0;left:0;width:40%;height:3px;background:var(--green);opacity:0.3"></div>

    <!-- Large background number -->
    <div style="position:absolute;right:-20px;bottom:-40px;font-family:var(--serif);font-size:320px;color:rgba(255,255,255,0.03);line-height:1;pointer-events:none;user-select:none">1</div>

    <!-- Content -->
    <div style="padding: 52px 60px; height: 100%; display: flex; flex-direction: column; justify-content: center;">
      ${slide.label ? `<div style="font-size:10px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:var(--green);margin-bottom:24px;font-family:var(--sans)">${slide.label}</div>` : ""}

      <h1 style="font-family:var(--serif);font-size:52px;line-height:1.1;color:white;margin-bottom:20px;max-width:560px;font-weight:400">
        ${slide.headline || "Präsentation"}
      </h1>

      ${slide.subheadline ? `<p style="font-size:14px;color:rgba(255,255,255,0.5);font-family:var(--sans);font-weight:300;max-width:420px;line-height:1.6">${slide.subheadline}</p>` : ""}

      <!-- Divider line -->
      <div style="width:48px;height:2px;background:var(--green);margin-top:36px"></div>
    </div>

    <!-- Footer -->
    <div class="slide-footer" style="background:rgba(255,255,255,0.04);border-top-color:rgba(255,255,255,0.08);color:rgba(255,255,255,0.25)">
      <span>ibox solutions GmbH <span class="dot" style="color:var(--green)">·</span> frank@ibox.eu.com</span>
      <span>${index + 1} <span class="dot">·</span> ${total}</span>
    </div>
  </div>`
}

function renderContent(slide: any, index: number, total: number): string {
  const bullets = (slide.bullets || []).filter(Boolean)
  return `
  <div class="slide">
    <div style="display:grid;grid-template-columns:200px 1fr;height:100%;gap:0">

      <!-- Left column — label + number -->
      <div style="background:var(--dark);padding:52px 32px;display:flex;flex-direction:column;justify-content:space-between;position:relative">
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:var(--green)"></div>
        ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);line-height:1.4">${slide.label.replace(/ /g, '\n')}</div>` : "<div></div>"}
        <div style="font-family:var(--serif);font-size:80px;color:rgba(255,255,255,0.08);line-height:1;font-weight:400">${String(index + 1).padStart(2, "0")}</div>
      </div>

      <!-- Right column — content -->
      <div style="padding:44px 52px 52px;display:flex;flex-direction:column;justify-content:center">
        <h2 style="font-family:var(--serif);font-size:32px;line-height:1.15;color:var(--dark);margin-bottom:${slide.subheadline ? "8px" : "24px"};font-weight:400;max-width:520px">
          ${slide.headline || ""}
        </h2>
        ${slide.subheadline ? `<p style="font-size:13px;color:var(--mid);margin-bottom:24px;font-weight:300;font-style:italic;line-height:1.5">${slide.subheadline}</p>` : ""}
        ${slide.text ? `<p style="font-size:13px;color:#444;line-height:1.75;max-width:500px;margin-bottom:${bullets.length ? "20px" : "0"}">${slide.text}</p>` : ""}
        ${bullets.length ? `
          <div style="space-y:8px">
            ${bullets.map((b: string) => `
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
                <div style="width:20px;height:20px;border-radius:50%;background:var(--green-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
                  <div style="width:6px;height:6px;border-radius:50%;background:var(--green)"></div>
                </div>
                <span style="font-size:13px;color:#333;line-height:1.55;font-weight:400">${b}</span>
              </div>
            `).join("")}
          </div>
        ` : ""}
      </div>
    </div>

    <div class="slide-footer">
      <span>ibox solutions <span class="dot">·</span> frank@ibox.eu.com</span>
      <span>${index + 1} <span class="dot">·</span> ${total}</span>
    </div>
  </div>`
}

function renderBullets(slide: any, index: number, total: number): string {
  const bullets = (slide.bullets || []).filter(Boolean)
  return `
  <div class="slide">
    <div style="padding: 52px 60px 52px; height: 100%; display: flex; flex-direction: column; justify-content: center;">

      ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);margin-bottom:20px">${slide.label}</div>` : ""}

      <h2 style="font-family:var(--serif);font-size:36px;line-height:1.15;color:var(--dark);margin-bottom:${slide.subheadline ? "8px" : "32px"};font-weight:400;max-width:600px">
        ${slide.headline || ""}
      </h2>
      ${slide.subheadline ? `<p style="font-size:13px;color:var(--mid);margin-bottom:28px;font-style:italic;font-weight:300">${slide.subheadline}</p>` : ""}

      <div style="display:grid;grid-template-columns:${bullets.length > 3 ? "1fr 1fr" : "1fr"};gap:12px 40px;max-width:680px">
        ${bullets.map((b: string, i: number) => `
          <div style="display:flex;align-items:flex-start;gap:16px;padding:14px 0;border-top:1px solid #F0F0F0">
            <span style="font-family:var(--serif);font-size:22px;color:var(--green);line-height:1;flex-shrink:0;margin-top:-2px">${String(i + 1).padStart(2, "0")}</span>
            <span style="font-size:13px;color:#333;line-height:1.55;font-weight:400">${b}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="slide-footer">
      <span>ibox solutions <span class="dot">·</span> frank@ibox.eu.com</span>
      <span>${index + 1} <span class="dot">·</span> ${total}</span>
    </div>
  </div>`
}

function renderComparison(slide: any, index: number, total: number): string {
  const bullets = (slide.bullets || []).filter(Boolean)
  const half = Math.ceil(bullets.length / 2)
  const left = bullets.slice(0, half)
  const right = bullets.slice(half)
  return `
  <div class="slide">
    <div style="padding: 48px 60px 52px; height: 100%; display: flex; flex-direction: column;">
      ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);margin-bottom:16px">${slide.label}</div>` : ""}
      <h2 style="font-family:var(--serif);font-size:32px;color:var(--dark);margin-bottom:28px;font-weight:400">${slide.headline || ""}</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1">
        <!-- Left -->
        <div style="padding-right:40px;border-right:1px solid #E8E8E8">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--mid);margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #E8E8E8">Standard</div>
          ${left.map((b: string) => `
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
              <span style="color:#BDBDBD;font-size:14px;flex-shrink:0;margin-top:1px">✕</span>
              <span style="font-size:12px;color:#888;line-height:1.5">${b}</span>
            </div>
          `).join("")}
        </div>
        <!-- Right -->
        <div style="padding-left:40px;background:rgba(48,158,59,0.03);margin:-48px -60px -52px 0;padding-top:48px;padding-right:60px;padding-bottom:52px">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--green);margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid var(--green)">ibox</div>
          ${right.map((b: string) => `
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
              <span style="color:var(--green);font-size:14px;flex-shrink:0;margin-top:1px">✓</span>
              <span style="font-size:12px;color:var(--dark);line-height:1.5;font-weight:500">${b}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>ibox solutions <span class="dot">·</span> frank@ibox.eu.com</span>
      <span>${index + 1} <span class="dot">·</span> ${total}</span>
    </div>
  </div>`
}

function renderCTA(slide: any, index: number, total: number): string {
  return `
  <div class="slide" style="background:var(--green)">
    <div style="position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.3)"></div>
    <!-- Pattern -->
    <div style="position:absolute;right:0;top:0;bottom:0;width:40%;opacity:0.06">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    </div>

    <div style="padding:60px 72px;height:100%;display:flex;flex-direction:column;justify-content:center;position:relative">
      ${slide.label ? `<div style="font-size:10px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:20px">${slide.label}</div>` : ""}

      <h2 style="font-family:var(--serif);font-size:48px;line-height:1.15;color:white;margin-bottom:16px;font-weight:400;max-width:520px">
        ${slide.headline || "Jetzt starten"}
      </h2>

      ${slide.text ? `<p style="font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:36px;max-width:460px;line-height:1.65;font-weight:300">${slide.text}</p>` : `<div style="height:28px"></div>`}

      <div style="display:flex;align-items:center;gap:20px">
        <div style="background:white;color:var(--green);font-weight:600;font-size:13px;padding:14px 32px;border-radius:4px;letter-spacing:0.02em">
          ${slide.ctaText || "Demo-Termin anfragen"}
        </div>
        <span style="font-size:13px;color:rgba(255,255,255,0.7);font-weight:300">frank@ibox.eu.com</span>
      </div>
    </div>

    <div class="slide-footer" style="background:rgba(0,0,0,0.1);border-top-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)">
      <span>ibox solutions GmbH <span class="dot" style="color:white">·</span> +43 664 911 24 63</span>
      <span>${index + 1} <span class="dot" style="color:white">·</span> ${total}</span>
    </div>
  </div>`
}

function renderSlide(slide: any, index: number, total: number): string {
  switch (slide.type) {
    case "cover": return renderCover(slide, index, total)
    case "bullets": return renderBullets(slide, index, total)
    case "comparison": return renderComparison(slide, index, total)
    case "cta": return renderCTA(slide, index, total)
    default: return renderContent(slide, index, total)
  }
}

function generateSlidesHTML(slides: any[], mode: string): string {
  if (!slides || slides.length === 0) return "<p>Keine Folien</p>"
  const total = slides.length
  const pages = slides.map((slide, i) => {
    if (mode === "sections") return renderSectionPage(slide, i, total)
    return renderSlide(slide, i, total)
  }).join("\n")
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${SLIDE_BASE_STYLES}</style>
</head>
<body>${pages}</body>
</html>`
}

// ─── SECTION MODE ─────────────────────────────────────────────────────────────
function renderSectionPage(slide: any, index: number, total: number): string {
  const bullets = (slide.bullets || []).filter(Boolean)
  const isHero = slide.type === "cover"
  const isCTA = slide.type === "cta"

  if (isHero) return `
  <div class="slide" style="background:var(--dark)">
    <div style="padding:60px;height:100%;display:flex;flex-direction:column;justify-content:center">
      ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:var(--green);margin-bottom:20px">${slide.label}</div>` : ""}
      <h1 style="font-family:var(--serif);font-size:56px;color:white;line-height:1.1;margin-bottom:16px;font-weight:400">${slide.headline || ""}</h1>
      ${slide.subheadline ? `<p style="font-size:15px;color:rgba(255,255,255,0.45);font-weight:300;max-width:480px">${slide.subheadline}</p>` : ""}
      <div style="width:48px;height:2px;background:var(--green);margin-top:32px"></div>
    </div>
    <div class="slide-footer" style="background:rgba(255,255,255,0.04);border-top-color:rgba(255,255,255,0.08);color:rgba(255,255,255,0.2)">
      <span>ibox solutions <span class="dot">·</span> frank@ibox.eu.com</span><span>${index + 1} / ${total}</span>
    </div>
  </div>`

  if (isCTA) return renderCTA(slide, index, total)

  return `
  <div class="slide">
    <div style="padding:52px 60px;height:100%;display:flex;flex-direction:column;justify-content:center">
      ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);margin-bottom:16px">${slide.label}</div>` : ""}
      <h2 style="font-family:var(--serif);font-size:34px;color:var(--dark);margin-bottom:${slide.subheadline ? "8px" : "24px"};font-weight:400;max-width:580px">${slide.headline || ""}</h2>
      ${slide.subheadline ? `<p style="font-size:13px;color:var(--mid);margin-bottom:20px;font-style:italic">${slide.subheadline}</p>` : ""}
      ${slide.text ? `<p style="font-size:13px;color:#444;line-height:1.75;max-width:620px;margin-bottom:${bullets.length ? "20px" : "0"}">${slide.text}</p>` : ""}
      ${bullets.length ? bullets.map((b: string) => `
        <div style="display:flex;gap:14px;margin-bottom:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #F5F5F5">
          <span style="color:var(--green);font-weight:600;flex-shrink:0;font-size:13px">→</span>
          <span style="font-size:13px;color:#333;line-height:1.55">${b}</span>
        </div>`).join("") : ""}
    </div>
    <div class="slide-footer">
      <span>ibox solutions <span class="dot">·</span> frank@ibox.eu.com</span><span>${index + 1} / ${total}</span>
    </div>
  </div>`
}

// ─── WEBSITE HTML ─────────────────────────────────────────────────────────────
function generateWebsiteHTML(slides: any[]): string {
  if (!slides || slides.length === 0) return "<p>Keine Inhalte</p>"
  const sections = slides.map(renderWebSection).join("\n")
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  ${FONTS}
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --green: #309E3B; --dark: #0F0F0F; --mid: #6B6B6B; --serif: 'DM Serif Display', Georgia, serif; --sans: 'DM Sans', -apple-system, sans-serif; }
  body { font-family: var(--sans); color: var(--dark); -webkit-font-smoothing: antialiased; }
  .hero { background: var(--dark); padding: 100px 80px; }
  .hero .label { font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: var(--green); margin-bottom: 20px; }
  .hero h1 { font-family: var(--serif); font-size: 3.5rem; color: white; line-height: 1.1; margin-bottom: 16px; font-weight: 400; max-width: 700px; }
  .hero p { font-size: 1rem; color: rgba(255,255,255,0.45); max-width: 520px; line-height: 1.7; font-weight: 300; }
  .section { padding: 72px 80px; }
  .section:nth-child(even) { background: #FAFAFA; }
  .section .label { font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--green); margin-bottom: 14px; }
  .section h2 { font-family: var(--serif); font-size: 2.2rem; margin-bottom: 20px; font-weight: 400; max-width: 640px; line-height: 1.2; }
  .section p { font-size: 0.95rem; color: #555; line-height: 1.75; max-width: 660px; margin-bottom: 16px; }
  .bullets { list-style: none; margin-top: 20px; }
  .bullets li { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #F0F0F0; font-size: 0.9rem; color: #333; line-height: 1.5; }
  .bullets li span.arrow { color: var(--green); font-weight: 700; flex-shrink: 0; }
  .cta { background: var(--green); padding: 80px; text-align: center; }
  .cta h2 { font-family: var(--serif); font-size: 2.8rem; color: white; margin-bottom: 16px; font-weight: 400; }
  .cta p { color: rgba(255,255,255,0.7); font-size: 1rem; margin-bottom: 36px; }
  .cta-btn { display: inline-block; background: white; color: var(--green); font-weight: 600; padding: 16px 40px; border-radius: 4px; font-size: 0.9rem; text-decoration: none; }
  .footer { background: var(--dark); color: rgba(255,255,255,0.3); padding: 32px 80px; font-size: 0.8rem; display: flex; justify-content: space-between; }
</style>
</head>
<body>${sections}
<div class="footer"><span>ibox solutions GmbH & Co KG · Saaz 102/3, 8341 Paldau · frank@ibox.eu.com</span><span>© ${new Date().getFullYear()}</span></div>
</body></html>`
}

function renderWebSection(slide: any): string {
  const bullets = (slide.bullets || []).filter(Boolean)
  if (slide.type === "cover") return `
  <div class="hero">
    ${slide.label ? `<div class="label">${slide.label}</div>` : ""}
    <h1>${slide.headline || ""}</h1>
    ${slide.subheadline ? `<p style="margin-top:12px">${slide.subheadline}</p>` : ""}
  </div>`

  if (slide.type === "cta") return `
  <div class="cta">
    ${slide.label ? `<div style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:16px">${slide.label}</div>` : ""}
    <h2>${slide.headline || "Jetzt starten"}</h2>
    ${slide.text ? `<p>${slide.text}</p>` : ""}
    <a href="mailto:frank@ibox.eu.com" class="cta-btn">${slide.ctaText || "Demo-Termin anfragen"}</a>
  </div>`

  return `
  <div class="section">
    ${slide.label ? `<div class="label">${slide.label}</div>` : ""}
    ${slide.headline ? `<h2>${slide.headline}</h2>` : ""}
    ${slide.subheadline ? `<p style="font-style:italic;color:#888;margin-bottom:16px">${slide.subheadline}</p>` : ""}
    ${slide.text ? `<p>${slide.text}</p>` : ""}
    ${bullets.length ? `<ul class="bullets">${bullets.map((b: string) => `<li><span class="arrow">→</span>${b}</li>`).join("")}</ul>` : ""}
  </div>`
}
