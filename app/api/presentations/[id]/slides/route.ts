import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const LOGO = "https://ibox-portal-main.vercel.app/ibox-logo.png"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const p = await prisma.presentation.findUnique({
    where: { id },
    select: { id: true, title: true, slidesData: true, editorMode: true, htmlSlide: true, htmlWebsite: true },
  })
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { slidesData, editorMode } = await req.json()
  const htmlSlide = buildFullHTML(slidesData, editorMode)
  const htmlWebsite = buildWebsiteHTML(slidesData)
  await prisma.presentation.update({
    where: { id },
    data: { slidesData, editorMode, htmlSlide, htmlWebsite, updatedAt: new Date() },
  })
  return NextResponse.json({ success: true, htmlSlide, htmlWebsite })
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const GREEN = "#309E3B"
const DARK = "#0F0F0F"
const MID = "#6B6B6B"
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');"

// Small logo HTML snippet — appears top-right on every slide
const logoSnippet = (dark = true) =>
  `<img src="${LOGO}" style="position:absolute;top:14px;right:18px;width:52px;height:52px;object-fit:contain;opacity:${dark ? "0.9" : "0.75"};z-index:20;" alt="ibox"/>`

// Accent bar top
const accentBar = `<div style="position:absolute;top:0;left:0;right:0;height:4px;background:${GREEN};z-index:10"></div>`

// Footer
const footer = (idx: number, total: number, dark = false) =>
  `<div style="position:absolute;bottom:0;left:0;right:0;height:38px;display:flex;align-items:center;justify-content:space-between;padding:0 44px;border-top:1px solid ${dark ? "rgba(255,255,255,0.08)" : "#EBEBEB"};font-size:9px;letter-spacing:0.08em;font-family:'DM Sans',-apple-system,sans-serif;font-weight:500;text-transform:uppercase;color:${dark ? "rgba(255,255,255,0.22)" : "#BDBDBD"}">
    <span>ibox solutions GmbH <span style="color:${GREEN};margin:0 5px">·</span> frank@ibox.eu.com</span>
    <span>${idx + 1} <span style="color:${GREEN}">·</span> ${total}</span>
  </div>`

const BASE_CSS = (isLight = false) => `
  ${FONT_IMPORT}
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --green: ${GREEN}; --dark: ${DARK}; --mid: ${MID};
    --serif: 'DM Serif Display', Georgia, serif;
    --sans: 'DM Sans', -apple-system, sans-serif;
  }
  html, body { width: 100%; height: 100%; overflow: hidden; font-family: var(--sans); -webkit-font-smoothing: antialiased; background: ${isLight ? "#FAFAFA" : DARK}; }
  .slide { width: 100%; height: 100%; position: relative; overflow: hidden; }
`

// ─── SLIDE RENDERERS ──────────────────────────────────────────────────────────

function renderCoverDark(s: any, i: number, t: number): string {
  return `<!DOCTYPE html><html><head><style>${BASE_CSS(false)}</style></head><body>
  <div class="slide" style="background:${DARK}">
    ${accentBar}
    ${logoSnippet(true)}
    <div style="position:absolute;right:-20px;bottom:-40px;font-family:var(--serif);font-size:320px;color:rgba(255,255,255,0.025);line-height:1;pointer-events:none">${String(i+1).padStart(2,"0")}</div>
    <div style="padding:52px 60px;height:100%;display:flex;flex-direction:column;justify-content:center">
      ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${GREEN};margin-bottom:22px">${s.label}</div>` : ""}
      <h1 style="font-family:var(--serif);font-size:50px;line-height:1.1;color:white;margin-bottom:18px;font-weight:400;max-width:560px">${s.headline || "Präsentation"}</h1>
      ${s.subheadline ? `<p style="font-size:14px;color:rgba(255,255,255,0.42);font-weight:300;max-width:420px;line-height:1.65">${s.subheadline}</p>` : ""}
      ${s.customerName ? `<div style="margin-top:28px;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;text-transform:uppercase">${s.customerName}</div>` : ""}
      <div style="width:44px;height:2px;background:${GREEN};margin-top:32px"></div>
    </div>
    ${footer(i, t, true)}
  </div></body></html>`
}

function renderCoverLight(s: any, i: number, t: number): string {
  return `<!DOCTYPE html><html><head><style>${BASE_CSS(true)}</style></head><body>
  <div class="slide" style="background:white">
    ${accentBar}
    ${logoSnippet(false)}
    <div style="position:absolute;right:-10px;bottom:-30px;font-family:var(--serif);font-size:280px;color:rgba(0,0,0,0.025);line-height:1;pointer-events:none">${String(i+1).padStart(2,"0")}</div>
    <div style="padding:52px 60px;height:100%;display:flex;flex-direction:column;justify-content:center">
      ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${GREEN};margin-bottom:22px">${s.label}</div>` : ""}
      <h1 style="font-family:var(--serif);font-size:50px;line-height:1.1;color:${DARK};margin-bottom:18px;font-weight:400;max-width:560px">${s.headline || "Präsentation"}</h1>
      ${s.subheadline ? `<p style="font-size:14px;color:${MID};font-weight:300;max-width:420px;line-height:1.65">${s.subheadline}</p>` : ""}
      <div style="width:44px;height:2px;background:${GREEN};margin-top:32px"></div>
    </div>
    ${footer(i, t, false)}
  </div></body></html>`
}

function renderContent(s: any, i: number, t: number): string {
  const bullets = (s.bullets || []).filter(Boolean)
  return `<!DOCTYPE html><html><head><style>${BASE_CSS(true)}</style></head><body>
  <div class="slide" style="background:white">
    ${accentBar}
    ${logoSnippet(false)}
    <div style="display:grid;grid-template-columns:180px 1fr;height:100%">
      <div style="background:${DARK};padding:52px 28px;display:flex;flex-direction:column;justify-content:space-between">
        ${s.label ? `<div style="font-size:8px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${GREEN};line-height:1.6;word-break:break-word">${s.label}</div>` : "<div></div>"}
        <div style="font-family:var(--serif);font-size:72px;color:rgba(255,255,255,0.06);line-height:1">${String(i+1).padStart(2,"0")}</div>
      </div>
      <div style="padding:48px 52px 52px;display:flex;flex-direction:column;justify-content:center">
        <h2 style="font-family:var(--serif);font-size:30px;line-height:1.15;color:${DARK};margin-bottom:${s.subheadline?"8px":"22px"};font-weight:400;max-width:500px">${s.headline||""}</h2>
        ${s.subheadline ? `<p style="font-size:12px;color:${MID};margin-bottom:20px;font-style:italic;line-height:1.5">${s.subheadline}</p>` : ""}
        ${s.text ? `<p style="font-size:12.5px;color:#444;line-height:1.75;max-width:480px;margin-bottom:${bullets.length?"18px":"0"}">${s.text}</p>` : ""}
        ${bullets.map((b:string)=>`<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:9px"><div style="width:18px;height:18px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px"><div style="width:5px;height:5px;border-radius:50%;background:${GREEN}"></div></div><span style="font-size:12px;color:#333;line-height:1.55">${b}</span></div>`).join("")}
      </div>
    </div>
    ${footer(i, t, false)}
  </div></body></html>`
}

function renderBullets(s: any, i: number, t: number): string {
  const bullets = (s.bullets || []).filter(Boolean)
  const cols = bullets.length > 4 ? 2 : 1
  return `<!DOCTYPE html><html><head><style>${BASE_CSS(true)}</style></head><body>
  <div class="slide" style="background:white">
    ${accentBar}
    ${logoSnippet(false)}
    <div style="padding:48px 60px 48px;height:100%;display:flex;flex-direction:column;justify-content:center">
      ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${GREEN};margin-bottom:16px">${s.label}</div>` : ""}
      <h2 style="font-family:var(--serif);font-size:32px;line-height:1.15;color:${DARK};margin-bottom:${s.subheadline?"8px":"26px"};font-weight:400;max-width:580px">${s.headline||""}</h2>
      ${s.subheadline ? `<p style="font-size:12px;color:${MID};margin-bottom:22px;font-style:italic">${s.subheadline}</p>` : ""}
      <div style="display:grid;grid-template-columns:${cols>1?"1fr 1fr":"1fr"};gap:0 40px;max-width:660px">
        ${bullets.map((b:string,j:number)=>`
          <div style="display:flex;align-items:flex-start;gap:14px;padding:11px 0;border-top:1px solid #F0F0F0">
            <span style="font-family:var(--serif);font-size:20px;color:${GREEN};line-height:1;flex-shrink:0">${String(j+1).padStart(2,"0")}</span>
            <span style="font-size:12px;color:#333;line-height:1.55">${b}</span>
          </div>`).join("")}
      </div>
    </div>
    ${footer(i, t, false)}
  </div></body></html>`
}

function renderComparison(s: any, i: number, t: number): string {
  const bullets = (s.bullets || []).filter(Boolean)
  const half = Math.ceil(bullets.length / 2)
  const left = bullets.slice(0, half)
  const right = bullets.slice(half)
  return `<!DOCTYPE html><html><head><style>${BASE_CSS(true)}</style></head><body>
  <div class="slide" style="background:white">
    ${accentBar}
    ${logoSnippet(false)}
    <div style="padding:44px 56px 52px;height:100%;display:flex;flex-direction:column">
      ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${GREEN};margin-bottom:12px">${s.label}</div>` : ""}
      <h2 style="font-family:var(--serif);font-size:28px;color:${DARK};margin-bottom:24px;font-weight:400">${s.headline||""}</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1">
        <div style="padding-right:36px;border-right:1px solid #E8E8E8">
          <div style="font-size:9px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#AAA;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #E8E8E8">Standard</div>
          ${left.map((b:string)=>`<div style="display:flex;gap:10px;margin-bottom:10px"><span style="color:#CCCCCC;font-size:13px;flex-shrink:0">✕</span><span style="font-size:11.5px;color:#888;line-height:1.5">${b}</span></div>`).join("")}
        </div>
        <div style="padding-left:36px;background:rgba(48,158,59,0.04);margin:-44px -56px -52px 0;padding-top:44px;padding-right:56px;padding-bottom:52px">
          <div style="font-size:9px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${GREEN};margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid ${GREEN}">ibox</div>
          ${right.map((b:string)=>`<div style="display:flex;gap:10px;margin-bottom:10px"><span style="color:${GREEN};font-size:13px;flex-shrink:0">✓</span><span style="font-size:11.5px;color:${DARK};line-height:1.5;font-weight:500">${b}</span></div>`).join("")}
        </div>
      </div>
    </div>
    ${footer(i, t, false)}
  </div></body></html>`
}

function renderCTA(s: any, i: number, t: number): string {
  return `<!DOCTYPE html><html><head><style>${BASE_CSS(false)}</style></head><body>
  <div class="slide" style="background:${GREEN}">
    <div style="position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.2)"></div>
    ${logoSnippet(true)}
    <div style="position:absolute;right:0;top:0;bottom:0;width:38%;opacity:0.055">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" stroke-width="0.8"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>
    </div>
    <div style="padding:60px 72px;height:100%;display:flex;flex-direction:column;justify-content:center;position:relative">
      ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:18px">${s.label}</div>` : ""}
      <h2 style="font-family:var(--serif);font-size:44px;line-height:1.12;color:white;margin-bottom:14px;font-weight:400;max-width:500px">${s.headline||"Jetzt starten"}</h2>
      ${s.text ? `<p style="font-size:13px;color:rgba(255,255,255,0.65);margin-bottom:32px;max-width:440px;line-height:1.65;font-weight:300">${s.text}</p>` : "<div style='height:24px'></div>"}
      <div style="display:flex;align-items:center;gap:20px">
        <div style="background:white;color:${GREEN};font-weight:600;font-size:12px;padding:13px 30px;border-radius:4px;letter-spacing:0.02em">${s.ctaText||"Demo-Termin anfragen"}</div>
        <span style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:300">frank@ibox.eu.com</span>
      </div>
    </div>
    ${footer(i, t, true)}
  </div></body></html>`
}

function renderOne(s: any, i: number, t: number, forExport = false): string {
  const theme = s.theme || (s.type === "cover" ? "dark" : "light")
  if (s.type === "cover") return theme === "light" ? renderCoverLight(s,i,t) : renderCoverDark(s,i,t)
  if (s.type === "bullets") return renderBullets(s,i,t)
  if (s.type === "comparison") return renderComparison(s,i,t)
  if (s.type === "cta") return renderCTA(s,i,t)
  return renderContent(s,i,t)
}

// ─── EXPORT HTML (all slides, print-ready) ────────────────────────────────────
function buildFullHTML(slides: any[], mode: string): string {
  if (!slides?.length) return "<p>Keine Folien</p>"
  const total = slides.length

  // Extract just the <body> content of each slide for multi-page export
  const pages = slides.map((s, i) => {
    const full = renderOne(s, i, total)
    // Wrap in a page container
    const inner = full.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, "").replace(/<\/body>[\s\S]*?<\/html>/i, "")
    return `<div class="page">${inner}</div>`
  }).join("\n")

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  ${FONT_IMPORT}
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #E0E0E0; font-family: 'DM Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  .page {
    width: 297mm; height: 210mm;
    position: relative; overflow: hidden;
    margin: 0 auto 24px; background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    page-break-after: always;
  }
  .page .slide { width: 100%; height: 100%; }
  @media print {
    body { background: white; }
    .page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>${pages}</body>
</html>`
}

// ─── WEBSITE HTML ─────────────────────────────────────────────────────────────
function buildWebsiteHTML(slides: any[]): string {
  if (!slides?.length) return "<p>Keine Inhalte</p>"
  const sections = slides.map(renderWebSection).join("\n")
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  ${FONT_IMPORT}
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{--green:${GREEN};--dark:${DARK};--serif:'DM Serif Display',Georgia,serif;--sans:'DM Sans',-apple-system,sans-serif}
  body{font-family:var(--sans);color:var(--dark);-webkit-font-smoothing:antialiased}
  .hero{background:var(--dark);padding:100px 80px;position:relative;overflow:hidden}
  .hero::after{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:var(--green)}
  .hero-logo{position:absolute;top:28px;right:40px;width:64px;height:64px;object-fit:contain;opacity:0.8}
  .hero h1{font-family:var(--serif);font-size:3.5rem;color:white;line-height:1.1;margin-bottom:16px;font-weight:400;max-width:700px}
  .hero p{font-size:1rem;color:rgba(255,255,255,0.42);max-width:520px;line-height:1.7;font-weight:300}
  .label{font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:var(--green);margin-bottom:12px}
  .section{padding:72px 80px}.section:nth-child(even){background:#FAFAFA}
  .section h2{font-family:var(--serif);font-size:2.2rem;margin-bottom:20px;font-weight:400;max-width:640px;line-height:1.2}
  .section p{font-size:.95rem;color:#555;line-height:1.75;max-width:660px;margin-bottom:16px}
  ul.bl{list-style:none;margin-top:20px}
  ul.bl li{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid #F0F0F0;font-size:.9rem;color:#333;line-height:1.5}
  ul.bl li .a{color:var(--green);font-weight:700;flex-shrink:0}
  .cta-s{background:var(--green);padding:80px;text-align:center}
  .cta-s h2{font-family:var(--serif);font-size:2.8rem;color:white;margin-bottom:16px;font-weight:400}
  .cta-s p{color:rgba(255,255,255,0.7);font-size:1rem;margin-bottom:36px}
  .cta-btn{display:inline-block;background:white;color:var(--green);font-weight:600;padding:16px 40px;border-radius:4px;font-size:.9rem;text-decoration:none}
  .foot{background:var(--dark);color:rgba(255,255,255,0.28);padding:32px 80px;font-size:.8rem;display:flex;justify-content:space-between;align-items:center}
  .foot img{width:40px;height:40px;object-fit:contain;opacity:0.5}
</style>
</head>
<body>
${sections}
<div class="foot">
  <img src="${LOGO}" alt="ibox"/>
  <span>ibox solutions GmbH & Co KG · Saaz 102/3, 8341 Paldau · frank@ibox.eu.com · +43 664 911 24 63</span>
  <span>© ${new Date().getFullYear()}</span>
</div>
</body></html>`
}

function renderWebSection(s: any): string {
  const bullets = (s.bullets || []).filter(Boolean)
  if (s.type === "cover") return `
  <div class="hero">
    <img class="hero-logo" src="${LOGO}" alt="ibox"/>
    ${s.label ? `<div class="label">${s.label}</div>` : ""}
    <h1>${s.headline||""}</h1>
    ${s.subheadline ? `<p style="margin-top:12px">${s.subheadline}</p>` : ""}
  </div>`
  if (s.type === "cta") return `
  <div class="cta-s">
    ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:14px">${s.label}</div>` : ""}
    <h2>${s.headline||"Jetzt starten"}</h2>
    ${s.text ? `<p>${s.text}</p>` : ""}
    <a href="mailto:frank@ibox.eu.com" class="cta-btn">${s.ctaText||"Demo-Termin anfragen"}</a>
  </div>`
  return `
  <div class="section">
    ${s.label ? `<div class="label">${s.label}</div>` : ""}
    ${s.headline ? `<h2>${s.headline}</h2>` : ""}
    ${s.subheadline ? `<p style="font-style:italic;color:#888;margin-bottom:16px">${s.subheadline}</p>` : ""}
    ${s.text ? `<p>${s.text}</p>` : ""}
    ${bullets.length ? `<ul class="bl">${bullets.map((b:string)=>`<li><span class="a">→</span>${b}</li>`).join("")}</ul>` : ""}
  </div>`
}
