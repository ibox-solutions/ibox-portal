import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const LOGO_URL = "https://ibox-portal-main.vercel.app/ibox-logo.png"

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
  const htmlSlide = buildDeckHTML(slidesData)
  const htmlWebsite = buildWebsiteHTML(slidesData)
  await prisma.presentation.update({
    where: { id },
    data: { slidesData, editorMode, htmlSlide, htmlWebsite, updatedAt: new Date() },
  })
  return NextResponse.json({ success: true, htmlSlide, htmlWebsite })
}

// ─── DECK HTML (interactive presentation) ────────────────────────────────────
function buildDeckHTML(slides: any[]): string {
  if (!slides?.length) return "<p>Keine Folien</p>"

  const slideHTML = slides.map((s, i) => buildSlideHTML(s, i, slides.length)).join("\n")

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --green: #309E3B; --green-glow: rgba(48,158,59,0.18);
  --green-dim: rgba(48,158,59,0.08);
  --dark: #0A0A0C; --dark2: #111113;
  --mid: #888; --white: #fff;
  --radius: 12px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; font-family: 'Open Sans', -apple-system, sans-serif; background: #000; overflow: hidden; -webkit-font-smoothing: antialiased; }

/* NAV */
#nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; height: 52px;
  background: rgba(0,0,0,0.88); backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(48,158,59,0.2);
}
#nav .logo { height: 28px; object-fit: contain; opacity: 0.9; }
#nav .nav-right { display: flex; align-items: center; gap: 20px; }
#nav .slide-counter { font-size: 11px; color: var(--mid); letter-spacing: 1px; font-weight: 600; }
#navDots { display: flex; gap: 6px; align-items: center; }
.ndot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; transition: all .3s; }
.ndot.active { background: var(--green); width: 20px; border-radius: 3px; }

/* DECK */
#deck { position: fixed; top: 52px; left: 0; right: 0; bottom: 0; overflow: hidden; }
.slide {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0; transform: translateX(48px);
  transition: opacity .5s cubic-bezier(.4,0,.2,1), transform .5s cubic-bezier(.4,0,.2,1);
  pointer-events: none; overflow: hidden;
}
.slide.active { opacity: 1; transform: translateX(0); pointer-events: all; }
.slide.prev { opacity: 0; transform: translateX(-48px); }
.slide .ai { animation: slideUp .55s cubic-bezier(.2,.8,.2,1) both; }
.slide .ai:nth-child(2) { animation-delay: .08s; }
.slide .ai:nth-child(3) { animation-delay: .16s; }
.slide .ai:nth-child(4) { animation-delay: .24s; }
.slide .ai:nth-child(5) { animation-delay: .32s; }
.slide .ai:nth-child(6) { animation-delay: .40s; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* ARROWS */
.arrow {
  position: fixed; top: 50%; transform: translateY(-50%); z-index: 90;
  width: 44px; height: 44px; border-radius: 50%;
  border: 1.5px solid rgba(48,158,59,0.35);
  background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
  color: var(--green); font-size: 1rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .2s;
}
.arrow:hover { background: var(--green); color: #fff; border-color: var(--green); }
#prev { left: 1rem; } #next { right: 1rem; }

/* PROGRESS */
#progress { position: fixed; bottom: 0; left: 0; height: 3px; background: var(--green); transition: width .5s cubic-bezier(.4,0,.2,1); z-index: 100; }

/* ── SLIDE TYPES ── */

/* COVER */
.s-cover {
  background: var(--dark);
  display: flex; align-items: center;
}
.s-cover::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse at 75% 50%, var(--green-glow) 0%, transparent 55%),
    radial-gradient(ellipse at 15% 90%, rgba(48,158,59,0.06) 0%, transparent 50%);
}
.s-cover::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 72%);
}
.s-cover .cc {
  position: relative; z-index: 1;
  max-width: 760px; padding: 0 8%;
}
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 7px 14px; border-radius: 6px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
  font-size: 10px; letter-spacing: 2px; font-weight: 700;
  text-transform: uppercase; color: rgba(255,255,255,.8);
  margin-bottom: 32px; backdrop-filter: blur(8px);
}
.eyebrow .dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--green);
  box-shadow: 0 0 0 0 rgba(48,158,59,.5); animation: pulse 1.8s ease-out infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(48,158,59,.6); }
  100% { box-shadow: 0 0 0 12px rgba(48,158,59,0); }
}
.s-cover h1 {
  font-size: clamp(36px, 5.5vw, 68px); line-height: 1.02;
  letter-spacing: -.025em; font-weight: 800; color: #fff; margin-bottom: 24px;
}
.s-cover h1 em { font-style: normal; color: var(--green); }
.s-cover .sub {
  font-size: clamp(15px, 1.4vw, 18px); font-weight: 300;
  color: rgba(255,255,255,.58); line-height: 1.55; max-width: 480px;
  margin-bottom: 40px;
}
.s-cover .divider { width: 44px; height: 3px; background: var(--green); margin-top: 8px; }
.meta-row {
  display: flex; gap: 40px; margin-top: 44px; padding-top: 28px;
  border-top: 1px solid rgba(255,255,255,.08); flex-wrap: wrap;
}
.meta-item .mv { font-size: 22px; font-weight: 800; color: #fff; }
.meta-item .mv em { font-style: normal; color: var(--green); }
.meta-item .ml { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; color: rgba(255,255,255,.45); text-transform: uppercase; margin-top: 4px; }

/* CONTENT (dark left col + light right) */
.s-content { background: var(--dark); display: flex; }
.s-content .col-l {
  width: 220px; flex-shrink: 0; background: rgba(255,255,255,.03);
  border-right: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 52px 28px;
}
.s-content .col-l .chapter {
  font-size: 9px; font-weight: 700; letter-spacing: .22em;
  text-transform: uppercase; color: var(--green); line-height: 1.6;
}
.s-content .col-l .num {
  font-size: 80px; font-weight: 800; color: rgba(255,255,255,.05);
  line-height: 1; letter-spacing: -.03em;
}
.s-content .col-r {
  flex: 1; padding: 52px 56px; display: flex; flex-direction: column; justify-content: center;
}
.s-content .col-r h2 {
  font-size: clamp(26px, 3vw, 38px); font-weight: 800;
  letter-spacing: -.02em; color: #fff; line-height: 1.12;
  margin-bottom: 16px;
}
.s-content .col-r .sub {
  font-size: 14px; color: rgba(255,255,255,.45); font-weight: 300;
  margin-bottom: 28px; line-height: 1.6; font-style: italic;
}
.s-content .col-r p {
  font-size: 14px; color: rgba(255,255,255,.65); line-height: 1.75;
  max-width: 560px; margin-bottom: 24px;
}
.s-content .col-r .bullets { display: flex; flex-direction: column; gap: 12px; max-width: 580px; }
.bullet-item {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 14px 18px; border-radius: var(--radius);
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
  transition: background .2s;
}
.bullet-item:hover { background: rgba(48,158,59,.08); border-color: rgba(48,158,59,.25); }
.bullet-dot {
  width: 22px; height: 22px; border-radius: 50%; background: var(--green-dim);
  border: 1.5px solid var(--green); display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; margin-top: 1px;
}
.bullet-dot::after { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.bullet-item span { font-size: 13px; color: rgba(255,255,255,.8); line-height: 1.55; }

/* BULLETS (numbered grid) */
.s-bullets { background: var(--dark); display: flex; align-items: center; }
.s-bullets .cc { max-width: 840px; padding: 0 8%; width: 100%; }
.s-bullets .chapter { font-size: 9px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--green); margin-bottom: 16px; }
.s-bullets h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; letter-spacing: -.02em; color: #fff; margin-bottom: 32px; }
.num-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.num-item {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 18px 20px; border-radius: var(--radius);
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
}
.num-item .n {
  font-size: 28px; font-weight: 800; color: var(--green);
  line-height: 1; flex-shrink: 0; letter-spacing: -.02em; opacity: .7;
  font-variant-numeric: tabular-nums;
}
.num-item .t { font-size: 13px; color: rgba(255,255,255,.75); line-height: 1.55; }

/* COMPARISON */
.s-comparison { background: var(--dark); display: flex; }
.s-comparison .cc { max-width: 920px; padding: 0 7%; width: 100%; }
.s-comparison .chapter { font-size: 9px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--green); margin-bottom: 12px; }
.s-comparison h2 { font-size: clamp(22px, 2.8vw, 34px); font-weight: 800; letter-spacing: -.02em; color: #fff; margin-bottom: 28px; }
.comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.comp-col { border-radius: var(--radius); overflow: hidden; }
.comp-col .comp-head {
  padding: 14px 20px; font-size: 10px; font-weight: 700;
  letter-spacing: .15em; text-transform: uppercase;
}
.comp-col.bad .comp-head { background: rgba(255,255,255,.06); color: rgba(255,255,255,.4); }
.comp-col.good .comp-head { background: var(--green); color: #fff; }
.comp-col .comp-body { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-top: 0; border-radius: 0 0 var(--radius) var(--radius); }
.comp-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.05);
}
.comp-row:last-child { border-bottom: 0; }
.comp-row .ci { font-size: 14px; flex-shrink: 0; width: 20px; }
.comp-row .ct { font-size: 12.5px; color: rgba(255,255,255,.65); line-height: 1.5; }
.comp-col.good .comp-row .ct { color: rgba(255,255,255,.85); font-weight: 500; }

/* CTA */
.s-cta {
  background: var(--dark);
  display: flex; align-items: center; justify-content: center; text-align: center;
}
.s-cta::before {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 60%, rgba(48,158,59,.22) 0%, transparent 60%);
}
.s-cta .cc { position: relative; z-index: 1; max-width: 640px; padding: 0 5%; }
.s-cta .chapter { font-size: 9px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--green); margin-bottom: 20px; }
.s-cta h2 { font-size: clamp(32px, 5vw, 60px); font-weight: 800; letter-spacing: -.025em; color: #fff; margin-bottom: 20px; line-height: 1.05; }
.s-cta h2 em { font-style: normal; color: var(--green); }
.s-cta p { font-size: 15px; color: rgba(255,255,255,.55); margin-bottom: 40px; line-height: 1.65; font-weight: 300; }
.cta-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 36px; border-radius: 8px;
  background: var(--green); color: #fff; font-weight: 700;
  font-size: 15px; text-decoration: none; cursor: pointer; border: 0;
  font-family: inherit; transition: transform .2s, box-shadow .2s;
}
.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -8px rgba(48,158,59,.5); }
.cta-meta { margin-top: 28px; font-size: 12px; color: rgba(255,255,255,.35); letter-spacing: .04em; }

/* SLIDE FOOTER */
.slide-footer {
  position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 48px; border-top: 1px solid rgba(255,255,255,.07);
  font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
  color: rgba(255,255,255,.22); font-weight: 600;
}
.slide-footer .sfc { color: var(--green); }
</style>
</head>
<body>

<nav id="nav">
  <img class="logo" src="${LOGO_URL}" alt="ibox"/>
  <div class="nav-right">
    <div id="navDots"></div>
    <div class="slide-counter" id="counter">01 / ${String(slides.length).padStart(2,"0")}</div>
  </div>
</nav>

<div id="deck">
${slideHTML}
</div>

<button class="arrow" id="prev">&#8592;</button>
<button class="arrow" id="next">&#8594;</button>
<div id="progress"></div>

<script>
const slides=document.querySelectorAll('.slide');
const dotsEl=document.getElementById('navDots');
const counter=document.getElementById('counter');
const progress=document.getElementById('progress');
let cur=0;const total=slides.length;
slides.forEach((_,i)=>{
  const d=document.createElement('div');
  d.className='ndot'+(i===0?' active':'');
  d.addEventListener('click',()=>go(i));
  dotsEl.appendChild(d);
});
function go(n){
  const dots=document.querySelectorAll('.ndot');
  slides[cur].classList.remove('active');slides[cur].classList.add('prev');
  setTimeout(()=>slides[cur].classList.remove('prev'),600);
  cur=(n+total)%total;
  slides[cur].classList.add('active');
  dots.forEach((d,i)=>d.classList.toggle('active',i===cur));
  counter.textContent=String(cur+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
  progress.style.width=((cur+1)/total*100)+'%';
}
document.getElementById('next').addEventListener('click',()=>go(cur+1));
document.getElementById('prev').addEventListener('click',()=>go(cur-1));
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key===' ')go(cur+1);
  if(e.key==='ArrowLeft')go(cur-1);
});
let tx=0;
document.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;});
document.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)go(cur+(dx<0?1:-1));});
progress.style.width=(1/total*100)+'%';
</script>
</body>
</html>`
}

// ─── INDIVIDUAL SLIDE HTML ────────────────────────────────────────────────────
function buildSlideHTML(s: any, i: number, total: number): string {
  const active = i === 0 ? " active" : ""
  const bullets = (s.bullets || []).filter(Boolean)
  const footerEl = `<div class="slide-footer ai">
    <span>ibox solutions GmbH <span class="sfc">·</span> frank@ibox.eu.com</span>
    <span>${String(i+1).padStart(2,"0")} <span class="sfc">·</span> ${String(total).padStart(2,"0")}</span>
  </div>`

  if (s.type === "cover") {
    const metaItems = bullets.slice(0, 3).map((b: string) => {
      const parts = b.split(":")
      return parts.length > 1
        ? `<div class="meta-item"><div class="mv"><em>${parts[0].trim()}</em></div><div class="ml">${parts[1].trim()}</div></div>`
        : `<div class="meta-item"><div class="mv">${b}</div></div>`
    }).join("")
    return `<div class="slide s-cover${active}">
      <div class="cc">
        ${s.label ? `<div class="eyebrow ai"><span class="dot"></span>${s.label}</div>` : ""}
        <h1 class="ai">${(s.headline||"Präsentation").replace(/\b(ibox[\.\w]*)\b/g, "<em>$1</em>")}</h1>
        ${s.subheadline ? `<p class="sub ai">${s.subheadline}</p>` : ""}
        <div class="divider ai"></div>
        ${metaItems ? `<div class="meta-row ai">${metaItems}</div>` : ""}
      </div>
      ${footerEl}
    </div>`
  }

  if (s.type === "bullets") {
    return `<div class="slide s-bullets${active}">
      <div class="cc">
        ${s.label ? `<div class="chapter ai">${s.label}</div>` : ""}
        <h2 class="ai">${s.headline||""}</h2>
        <div class="num-grid">
          ${bullets.map((b: string, j: number) => `
            <div class="num-item ai" style="animation-delay:${(j*0.08).toFixed(2)}s">
              <div class="n">${String(j+1).padStart(2,"0")}</div>
              <div class="t">${b}</div>
            </div>`).join("")}
        </div>
      </div>
      ${footerEl}
    </div>`
  }

  if (s.type === "comparison") {
    const half = Math.ceil(bullets.length / 2)
    const left = bullets.slice(0, half)
    const right = bullets.slice(half)
    return `<div class="slide s-comparison${active}">
      <div class="cc" style="display:flex;flex-direction:column;justify-content:center;height:100%;padding-top:20px">
        ${s.label ? `<div class="chapter ai">${s.label}</div>` : ""}
        <h2 class="ai">${s.headline||""}</h2>
        <div class="comp-grid ai">
          <div class="comp-col bad">
            <div class="comp-head">Standard</div>
            <div class="comp-body">
              ${left.map((b:string) => `<div class="comp-row"><span class="ci" style="color:#555">✕</span><span class="ct">${b}</span></div>`).join("")}
            </div>
          </div>
          <div class="comp-col good">
            <div class="comp-head">ibox</div>
            <div class="comp-body">
              ${right.map((b:string) => `<div class="comp-row"><span class="ci" style="color:var(--green)">✓</span><span class="ct">${b}</span></div>`).join("")}
            </div>
          </div>
        </div>
      </div>
      ${footerEl}
    </div>`
  }

  if (s.type === "cta") {
    return `<div class="slide s-cta${active}">
      <div class="cc">
        ${s.label ? `<div class="chapter ai">${s.label}</div>` : ""}
        <h2 class="ai">${(s.headline||"Jetzt starten").replace(/\b(ibox[\.\w]*)\b/g, "<em>$1</em>")}</h2>
        ${s.text ? `<p class="ai">${s.text}</p>` : ""}
        <div class="ai">
          <a class="cta-btn" href="mailto:frank@ibox.eu.com">${s.ctaText||"Demo-Termin anfragen"} →</a>
        </div>
        <div class="cta-meta ai">frank@ibox.eu.com &nbsp;·&nbsp; +43 664 911 24 63 &nbsp;·&nbsp; ibox.eu.com</div>
      </div>
      ${footerEl}
    </div>`
  }

  // Default: content
  return `<div class="slide s-content${active}">
    <div class="col-l">
      ${s.label ? `<div class="chapter ai">${s.label}</div>` : "<div></div>"}
      <div class="num ai">${String(i+1).padStart(2,"0")}</div>
    </div>
    <div class="col-r">
      <h2 class="ai">${s.headline||""}</h2>
      ${s.subheadline ? `<p class="sub ai">${s.subheadline}</p>` : ""}
      ${s.text ? `<p class="ai">${s.text}</p>` : ""}
      ${bullets.length ? `<div class="bullets ai">
        ${bullets.map((b:string,j:number) => `
          <div class="bullet-item" style="animation-delay:${(j*0.08+0.2).toFixed(2)}s">
            <div class="bullet-dot"></div>
            <span>${b}</span>
          </div>`).join("")}
      </div>` : ""}
    </div>
    ${footerEl}
  </div>`
}

// ─── WEBSITE HTML (REWE-style scrollable) ────────────────────────────────────
function buildWebsiteHTML(slides: any[]): string {
  if (!slides?.length) return "<p>Keine Inhalte</p>"
  const sections = slides.map(renderWebSection).join("\n")
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<style>
:root { --green:#309E3B; --dark:#0A0A0C; --mid:#707073; --light:#F2F2F4; --radius:14px; --max:1140px; }
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Open Sans',-apple-system,sans-serif;color:#1A1A1C;background:#fff;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.inner{max-width:var(--max);margin:0 auto;padding:0 28px}
.hero-w{background:var(--dark);padding:100px 0;position:relative;overflow:hidden}
.hero-w::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 70% 50%,rgba(48,158,59,.18) 0%,transparent 55%)}
.hero-w .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;color:rgba(255,255,255,.8);margin-bottom:28px}
.hero-w .dot{width:6px;height:6px;border-radius:50%;background:var(--green)}
.hero-w img.logo{height:32px;object-fit:contain;opacity:.85;margin-bottom:32px}
.hero-w h1{font-size:clamp(36px,5vw,64px);font-weight:800;letter-spacing:-.025em;color:#fff;line-height:1.05;margin-bottom:20px}
.hero-w h1 em{font-style:normal;color:var(--green)}
.hero-w p{font-size:17px;color:rgba(255,255,255,.55);max-width:520px;line-height:1.6;font-weight:300}
.section{padding:72px 0}.section:nth-child(even){background:#FAFAFA}
.section .lbl{font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--green);margin-bottom:12px}
.section h2{font-size:clamp(24px,3vw,38px);font-weight:800;letter-spacing:-.02em;margin-bottom:20px;line-height:1.15;max-width:700px}
.section p{font-size:15px;color:#555;line-height:1.75;max-width:660px;margin-bottom:16px}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:24px}
.card{padding:20px 24px;border-radius:var(--radius);background:#fff;border:1px solid #E8E8E8;box-shadow:0 4px 16px -4px rgba(0,0,0,.07)}
.card .cn{font-size:28px;font-weight:800;color:var(--green);opacity:.7;margin-bottom:10px;letter-spacing:-.02em}
.card p{font-size:13.5px;color:#444;line-height:1.6;margin:0}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}
.comp-col{border-radius:var(--radius);overflow:hidden;border:1px solid #E8E8E8}
.comp-col .ch{padding:12px 20px;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase}
.comp-col.bad .ch{background:#F5F5F5;color:#999}
.comp-col.good .ch{background:var(--green);color:#fff}
.comp-row{display:flex;gap:12px;padding:11px 16px;border-top:1px solid #F0F0F0;font-size:13px;color:#555;align-items:flex-start}
.comp-col.good .comp-row{color:#1A1A1C;font-weight:500}
.ci{flex-shrink:0;width:16px}
.cta-w{background:var(--dark);padding:80px 0;text-align:center;position:relative}
.cta-w::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(48,158,59,.2) 0%,transparent 60%)}
.cta-w h2{font-size:clamp(28px,4vw,52px);font-weight:800;letter-spacing:-.025em;color:#fff;margin-bottom:16px;position:relative}
.cta-w h2 em{font-style:normal;color:var(--green)}
.cta-w p{font-size:15px;color:rgba(255,255,255,.5);margin-bottom:36px;position:relative;font-weight:300}
.cta-w a{position:relative;display:inline-flex;align-items:center;gap:8px;padding:15px 36px;border-radius:8px;background:var(--green);color:#fff;font-weight:700;font-size:15px;text-decoration:none}
footer{background:#0A0A0C;color:rgba(255,255,255,.3);padding:32px 28px;display:flex;justify-content:space-between;align-items:center;font-size:12px;max-width:100%}
footer img{height:24px;opacity:.4;object-fit:contain}
</style>
</head>
<body>
${sections}
<footer>
  <img src="${LOGO_URL}" alt="ibox"/>
  <span>ibox solutions GmbH & Co KG · Saaz 102/3, 8341 Paldau · frank@ibox.eu.com</span>
  <span>© ${new Date().getFullYear()}</span>
</footer>
</body></html>`
}

function renderWebSection(s: any): string {
  const bullets = (s.bullets || []).filter(Boolean)
  if (s.type === "cover") return `
  <div class="hero-w">
    <div class="inner">
      <img class="logo" src="${LOGO_URL}" alt="ibox"/>
      ${s.label ? `<div class="eyebrow"><span class="dot"></span>${s.label}</div>` : ""}
      <h1>${(s.headline||"").replace(/\b(ibox[\.\w]*)\b/g,"<em>$1</em>")}</h1>
      ${s.subheadline ? `<p style="margin-top:12px">${s.subheadline}</p>` : ""}
    </div>
  </div>`
  if (s.type === "cta") return `
  <div class="cta-w">
    <div class="inner">
      ${s.label ? `<div style="font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:16px;position:relative">${s.label}</div>` : ""}
      <h2>${(s.headline||"Jetzt starten").replace(/\b(ibox[\.\w]*)\b/g,"<em>$1</em>")}</h2>
      ${s.text ? `<p>${s.text}</p>` : ""}
      <a href="mailto:frank@ibox.eu.com">${s.ctaText||"Demo-Termin anfragen"} →</a>
    </div>
  </div>`
  if (s.type === "comparison") {
    const half = Math.ceil(bullets.length/2)
    const left = bullets.slice(0,half)
    const right = bullets.slice(half)
    return `
  <div class="section">
    <div class="inner">
      ${s.label ? `<div class="lbl">${s.label}</div>` : ""}
      <h2>${s.headline||""}</h2>
      <div class="comp-grid">
        <div class="comp-col bad"><div class="ch">Standard</div>${left.map((b:string)=>`<div class="comp-row"><span class="ci" style="color:#CCC">✕</span>${b}</div>`).join("")}</div>
        <div class="comp-col good"><div class="ch">ibox</div>${right.map((b:string)=>`<div class="comp-row"><span class="ci">✓</span>${b}</div>`).join("")}</div>
      </div>
    </div>
  </div>`
  }
  if (s.type === "bullets") return `
  <div class="section">
    <div class="inner">
      ${s.label ? `<div class="lbl">${s.label}</div>` : ""}
      <h2>${s.headline||""}</h2>
      <div class="card-grid">
        ${bullets.map((b:string,j:number)=>`<div class="card"><div class="cn">${String(j+1).padStart(2,"0")}</div><p>${b}</p></div>`).join("")}
      </div>
    </div>
  </div>`
  return `
  <div class="section">
    <div class="inner">
      ${s.label ? `<div class="lbl">${s.label}</div>` : ""}
      ${s.headline ? `<h2>${s.headline}</h2>` : ""}
      ${s.subheadline ? `<p style="font-style:italic;color:#888;margin-bottom:16px">${s.subheadline}</p>` : ""}
      ${s.text ? `<p>${s.text}</p>` : ""}
      ${bullets.length ? `<div class="card-grid">${bullets.map((b:string,j:number)=>`<div class="card"><div class="cn">${String(j+1).padStart(2,"0")}</div><p>${b}</p></div>`).join("")}</div>` : ""}
    </div>
  </div>`
}
