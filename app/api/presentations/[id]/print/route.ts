import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const LOGO_URL = "https://ibox-portal-main.vercel.app/ibox-logo.png"
const GREEN = "#309E3B"
const DARK = "#0A0A0C"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    select: { id: true, title: true, slidesData: true },
  })

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const slides = (presentation.slidesData as any[]) || []
  const total = slides.length

  const slidePages = slides.map((s, i) => buildPrintSlide(s, i, total)).join("\n")

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<title>${presentation.title} — Print</title>
<style>
  @page {
    size: A4 landscape;
    margin: 0;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Open Sans', -apple-system, sans-serif;
    background: #888;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 297mm;
    height: 210mm;
    position: relative;
    overflow: hidden;
    background: ${DARK};
    page-break-after: always;
    break-after: page;
    margin: 0 auto 8px;
    display: flex;
    flex-direction: column;
  }
  @media print {
    body { background: white; }
    .page { margin: 0; box-shadow: none; }
  }

  /* NAV BAR */
  .nav { height: 40px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 20mm; background: rgba(0,0,0,0.5);
    border-bottom: 1px solid rgba(48,158,59,0.3); flex-shrink: 0; }
  .nav img { height: 20px; object-fit: contain; opacity: 0.85; }
  .nav-counter { font-size: 8px; color: rgba(255,255,255,0.4); letter-spacing: 1px; font-weight: 600; }

  /* CONTENT AREA */
  .content { flex: 1; position: relative; display: flex; overflow: hidden; }

  /* FOOTER */
  .foot { height: 32px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 20mm; border-top: 1px solid rgba(255,255,255,0.07);
    font-size: 7.5px; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,0.2); font-weight: 600; flex-shrink: 0; }
  .foot .g { color: ${GREEN}; }

  /* COVER */
  .s-cover { background: ${DARK}; }
  .s-cover .bg-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(48,158,59,0.2) 0%, transparent 55%);
  }
  .s-cover .bg-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(ellipse at center, #000 30%, transparent 72%);
    -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 72%);
  }
  .s-cover .cc { position: relative; z-index: 1; padding: 8mm 20mm; display: flex; flex-direction: column; justify-content: center; height: 100%; }
  .eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px;
    border-radius: 4px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
    font-size: 8px; letter-spacing: 2px; font-weight: 700; text-transform: uppercase;
    color: rgba(255,255,255,.8); margin-bottom: 16px; width: fit-content; }
  .eyebrow .dot { width: 5px; height: 5px; border-radius: 50%; background: ${GREEN}; flex-shrink: 0; }
  .s-cover h1 { font-size: 38px; line-height: 1.05; letter-spacing: -.025em; font-weight: 800;
    color: white; margin-bottom: 14px; max-width: 160mm; }
  .s-cover h1 em { font-style: normal; color: ${GREEN}; }
  .s-cover .sub { font-size: 13px; font-weight: 300; color: rgba(255,255,255,.5); line-height: 1.5; max-width: 120mm; margin-bottom: 20px; }
  .s-cover .divider { width: 32px; height: 2px; background: ${GREEN}; margin-bottom: 20px; }
  .meta-row { display: flex; gap: 28px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.08); }
  .meta-item .mv { font-size: 16px; font-weight: 800; color: white; }
  .meta-item .mv em { font-style: normal; color: ${GREEN}; }
  .meta-item .ml { font-size: 7px; font-weight: 700; letter-spacing: 1.5px; color: rgba(255,255,255,.4); text-transform: uppercase; margin-top: 3px; }

  /* CONTENT (two col) */
  .s-content { display: flex; }
  .s-content .col-l { width: 46mm; flex-shrink: 0; background: rgba(255,255,255,.03);
    border-right: 1px solid rgba(255,255,255,.07);
    display: flex; flex-direction: column; justify-content: space-between; padding: 8mm 6mm; }
  .s-content .col-l .chapter { font-size: 7px; font-weight: 700; letter-spacing: .2em;
    text-transform: uppercase; color: ${GREEN}; line-height: 1.5; }
  .s-content .col-l .num { font-size: 52px; font-weight: 800; color: rgba(255,255,255,.05); line-height: 1; letter-spacing: -.03em; }
  .s-content .col-r { flex: 1; padding: 8mm 10mm; display: flex; flex-direction: column; justify-content: center; }
  .s-content .col-r h2 { font-size: 24px; font-weight: 800; letter-spacing: -.02em; color: white; line-height: 1.1; margin-bottom: 8px; }
  .s-content .col-r .sub { font-size: 10px; color: rgba(255,255,255,.4); margin-bottom: 12px; font-style: italic; }
  .s-content .col-r p { font-size: 11px; color: rgba(255,255,255,.6); line-height: 1.7; margin-bottom: 12px; max-width: 140mm; }
  .bullets { display: flex; flex-direction: column; gap: 6px; }
  .bi { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 6px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); }
  .bi-dot { width: 14px; height: 14px; border-radius: 50%; background: rgba(48,158,59,.12);
    border: 1px solid ${GREEN}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .bi-dot::after { content: ""; width: 4px; height: 4px; border-radius: 50%; background: ${GREEN}; }
  .bi span { font-size: 10.5px; color: rgba(255,255,255,.78); line-height: 1.5; }

  /* BULLETS (numbered grid) */
  .s-bullets { display: flex; align-items: center; }
  .s-bullets .cc { padding: 8mm 20mm; width: 100%; }
  .s-bullets .chapter { font-size: 7px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: ${GREEN}; margin-bottom: 8px; }
  .s-bullets h2 { font-size: 22px; font-weight: 800; letter-spacing: -.02em; color: white; margin-bottom: 16px; }
  .num-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .ni { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 6px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); }
  .ni .n { font-size: 18px; font-weight: 800; color: ${GREEN}; opacity: .65; flex-shrink: 0; line-height: 1; }
  .ni .t { font-size: 10.5px; color: rgba(255,255,255,.75); line-height: 1.5; }

  /* COMPARISON */
  .s-comparison .cc { padding: 8mm 16mm; width: 100%; display: flex; flex-direction: column; justify-content: center; height: 100%; }
  .s-comparison .chapter { font-size: 7px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: ${GREEN}; margin-bottom: 6px; }
  .s-comparison h2 { font-size: 20px; font-weight: 800; letter-spacing: -.02em; color: white; margin-bottom: 14px; }
  .comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .comp-col { border-radius: 6px; overflow: hidden; }
  .comp-col .ch { padding: 8px 12px; font-size: 8px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
  .comp-col.bad .ch { background: rgba(255,255,255,.06); color: rgba(255,255,255,.35); }
  .comp-col.good .ch { background: ${GREEN}; color: white; }
  .comp-col .cb { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-top: 0; border-radius: 0 0 6px 6px; }
  .cr { display: flex; align-items: flex-start; gap: 8px; padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,.05); font-size: 10px; }
  .cr:last-child { border-bottom: 0; }
  .cr .ci { flex-shrink: 0; width: 14px; font-size: 11px; }
  .cr .ct { color: rgba(255,255,255,.6); line-height: 1.4; }
  .comp-col.good .cr .ct { color: rgba(255,255,255,.85); font-weight: 600; }

  /* CTA */
  .s-cta { background: ${DARK}; display: flex; align-items: center; justify-content: center; text-align: center; }
  .s-cta .bg-glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 60%, rgba(48,158,59,.25) 0%, transparent 60%); }
  .s-cta .cc { position: relative; z-index: 1; padding: 8mm 20mm; }
  .s-cta .chapter { font-size: 7px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: ${GREEN}; margin-bottom: 12px; }
  .s-cta h2 { font-size: 32px; font-weight: 800; letter-spacing: -.025em; color: white; margin-bottom: 12px; line-height: 1.05; }
  .s-cta h2 em { font-style: normal; color: ${GREEN}; }
  .s-cta p { font-size: 12px; color: rgba(255,255,255,.5); margin-bottom: 24px; font-weight: 300; line-height: 1.6; }
  .cta-btn { display: inline-block; padding: 11px 28px; border-radius: 6px; background: ${GREEN}; color: white; font-weight: 700; font-size: 12px; margin-bottom: 14px; }
  .cta-meta { font-size: 9px; color: rgba(255,255,255,.3); letter-spacing: .05em; }
  .cta-steps { display: flex; flex-direction: column; gap: 6px; margin-top: 16px; text-align: left; max-width: 160mm; margin-left: auto; margin-right: auto; }
  .cta-step { display: flex; gap: 10px; padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); font-size: 10px; color: rgba(255,255,255,.7); }
  .cta-step .ck { color: ${GREEN}; font-weight: 700; flex-shrink: 0; }
</style>
</head>
<body>
${slidePages}
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function buildPrintSlide(s: any, i: number, total: number): string {
  const bullets = (s.bullets || []).filter(Boolean)

  const nav = `<div class="nav"><img src="${LOGO_URL}" alt="ibox"/><span class="nav-counter">${String(i+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}</span></div>`
  const foot = `<div class="foot"><span>ibox solutions GmbH <span class="g">·</span> frank@ibox.eu.com <span class="g">·</span> +43 664 911 24 63</span><span>${String(i+1).padStart(2,"0")} <span class="g">·</span> ${String(total).padStart(2,"0")}</span></div>`

  if (s.type === "cover") {
    const metaItems = bullets.slice(0, 3).map((b: string) => {
      const parts = b.split(":")
      return parts.length > 1
        ? `<div class="meta-item"><div class="mv"><em>${parts[0].trim()}</em></div><div class="ml">${parts[1].trim()}</div></div>`
        : `<div class="meta-item"><div class="mv">${b}</div></div>`
    }).join("")
    return `<div class="page s-cover">
      ${nav}
      <div class="content s-cover">
        <div class="bg-glow"></div><div class="bg-grid"></div>
        <div class="cc">
          ${s.label ? `<div class="eyebrow"><span class="dot"></span>${s.label}</div>` : ""}
          <h1>${(s.headline||"").replace(/\b(ibox[\.\w]*)\b/g,'<em>$1</em>')}</h1>
          ${s.subheadline ? `<p class="sub">${s.subheadline}</p>` : ""}
          <div class="divider"></div>
          ${metaItems ? `<div class="meta-row">${metaItems}</div>` : ""}
        </div>
      </div>
      ${foot}
    </div>`
  }

  if (s.type === "bullets") {
    const half = Math.ceil(bullets.length / 2)
    return `<div class="page s-bullets" style="background:${DARK}">
      ${nav}
      <div class="content s-bullets">
        <div class="cc">
          ${s.label ? `<div class="chapter">${s.label}</div>` : ""}
          <h2>${s.headline||""}</h2>
          <div class="num-grid">
            ${bullets.map((b: string, j: number) => `<div class="ni"><div class="n">${String(j+1).padStart(2,"0")}</div><div class="t">${b}</div></div>`).join("")}
          </div>
        </div>
      </div>
      ${foot}
    </div>`
  }

  if (s.type === "comparison") {
    const half = Math.ceil(bullets.length / 2)
    const left = bullets.slice(0, half)
    const right = bullets.slice(half)
    return `<div class="page s-comparison" style="background:${DARK}">
      ${nav}
      <div class="content s-comparison">
        <div class="cc">
          ${s.label ? `<div class="chapter">${s.label}</div>` : ""}
          <h2>${s.headline||""}</h2>
          <div class="comp-grid">
            <div class="comp-col bad">
              <div class="ch">Standard</div>
              <div class="cb">${left.map((b:string)=>`<div class="cr"><span class="ci" style="color:#444">✕</span><span class="ct">${b}</span></div>`).join("")}</div>
            </div>
            <div class="comp-col good">
              <div class="ch">ibox</div>
              <div class="cb">${right.map((b:string)=>`<div class="cr"><span class="ci" style="color:${GREEN}">✓</span><span class="ct">${b}</span></div>`).join("")}</div>
            </div>
          </div>
        </div>
      </div>
      ${foot}
    </div>`
  }

  if (s.type === "cta") {
    const steps = bullets.filter((b:string) => b.startsWith("✓") || b.startsWith("•") || b.length > 0).slice(0, 4)
    return `<div class="page s-cta">
      ${nav}
      <div class="content s-cta">
        <div class="bg-glow"></div>
        <div class="cc">
          ${s.label ? `<div class="chapter">${s.label}</div>` : ""}
          <h2>${(s.headline||"Jetzt starten").replace(/\b(ibox[\.\w]*)\b/g,'<em>$1</em>')}</h2>
          ${s.text ? `<p>${s.text}</p>` : ""}
          <div class="cta-btn">${s.ctaText||"Demo-Termin anfragen"} →</div>
          <div class="cta-meta">frank@ibox.eu.com · +43 664 911 24 63 · ibox.eu.com</div>
          ${steps.length ? `<div class="cta-steps">${steps.map((b:string)=>`<div class="cta-step"><span class="ck">✓</span>${b.replace(/^[✓•]\s*/,"")}</div>`).join("")}</div>` : ""}
        </div>
      </div>
      ${foot}
    </div>`
  }

  // Default: content (two column)
  return `<div class="page s-content" style="background:${DARK}">
    ${nav}
    <div class="content s-content">
      <div class="col-l">
        ${s.label ? `<div class="chapter">${s.label}</div>` : "<div></div>"}
        <div class="num">${String(i+1).padStart(2,"0")}</div>
      </div>
      <div class="col-r">
        <h2>${s.headline||""}</h2>
        ${s.subheadline ? `<p class="sub">${s.subheadline}</p>` : ""}
        ${s.text ? `<p>${s.text}</p>` : ""}
        ${bullets.length ? `<div class="bullets">${bullets.map((b:string)=>`<div class="bi"><div class="bi-dot"></div><span>${b}</span></div>`).join("")}</div>` : ""}
      </div>
    </div>
    ${foot}
  </div>`
}
