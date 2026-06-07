"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const SLIDE_TYPES = [
  { value: "cover", label: "Deckblatt", icon: "🎯" },
  { value: "content", label: "Inhalt", icon: "📄" },
  { value: "bullets", label: "Aufzählung", icon: "📋" },
  { value: "comparison", label: "Vergleich", icon: "⚖️" },
  { value: "cta", label: "Call to Action", icon: "🚀" },
]

interface Slide {
  id: string
  type: string
  label?: string
  headline?: string
  subheadline?: string
  text?: string
  bullets?: string[]
  ctaText?: string
  backgroundColor?: string
}

export default function PresentationEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const [presentation, setPresentation] = useState<any>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [editorMode, setEditorMode] = useState<"slides" | "sections">("slides")
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/presentations/${id}/slides`)
      .then((r) => r.json())
      .then((data) => {
        setPresentation(data)
        setSlides((data.slidesData as Slide[]) || [])
        setEditorMode(data.editorMode || "slides")
        if (data.slidesData?.length > 0) setSelectedSlide(data.slidesData[0].id)
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const currentSlide = slides.find((s) => s.id === selectedSlide)

  const updateSlide = (field: string, value: any) => {
    setSlides((prev) => prev.map((s) =>
      s.id === selectedSlide ? { ...s, [field]: value } : s
    ))
  }

  const updateBullet = (index: number, value: string) => {
    const bullets = [...(currentSlide?.bullets || [])]
    bullets[index] = value
    updateSlide("bullets", bullets)
  }

  const addBullet = () => {
    updateSlide("bullets", [...(currentSlide?.bullets || []), ""])
  }

  const removeBullet = (index: number) => {
    const bullets = [...(currentSlide?.bullets || [])]
    bullets.splice(index, 1)
    updateSlide("bullets", bullets)
  }

  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      type: "content",
      headline: "Neue Folie",
      bullets: [],
    }
    setSlides((prev) => [...prev, newSlide])
    setSelectedSlide(newSlide.id)
  }

  const deleteSlide = (slideId: string) => {
    if (slides.length <= 1) return
    const newSlides = slides.filter((s) => s.id !== slideId)
    setSlides(newSlides)
    if (selectedSlide === slideId) setSelectedSlide(newSlides[0]?.id || null)
  }

  const moveSlide = (slideId: string, direction: "up" | "down") => {
    const idx = slides.findIndex((s) => s.id === slideId)
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === slides.length - 1) return
    const newSlides = [...slides]
    const target = direction === "up" ? idx - 1 : idx + 1
    ;[newSlides[idx], newSlides[target]] = [newSlides[target], newSlides[idx]]
    setSlides(newSlides)
  }

  const save = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/presentations/${id}/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slidesData: slides, editorMode }),
      })
      if (res.ok) {
        setSaveMessage("✅ Gespeichert")
      } else {
        setSaveMessage("❌ Fehler beim Speichern")
      }
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const exportPDF = async () => {
    setIsExporting(true)
    // Save first
    await fetch(`/api/presentations/${id}/slides`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slidesData: slides, editorMode }),
    })
    // Open print dialog
    const res = await fetch(`/api/presentations/${id}/slides`)
    const data = await res.json()
    const printWindow = window.open("", "_blank")
    if (printWindow && data.htmlSlide) {
      printWindow.document.write(data.htmlSlide)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
    }
    setIsExporting(false)
  }

  const exportHTML = async () => {
    await fetch(`/api/presentations/${id}/slides`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slidesData: slides, editorMode }),
    })
    const res = await fetch(`/api/presentations/${id}/slides`)
    const data = await res.json()
    const html = editorMode === "slides" ? data.htmlSlide : data.htmlWebsite
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${presentation?.title || "praesentation"}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Live preview HTML
  const LOGO = "/ibox-logo.png"
  const GREEN = "#309E3B"
  const DARK = "#0F0F0F"
  const MID = "#6B6B6B"
  const SERIF = "'DM Serif Display', Georgia, serif"
  const SANS = "'DM Sans', -apple-system, sans-serif"
  const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');"

  const logoImg = (dark = false) =>
    `<img src="${LOGO}" style="position:absolute;top:12px;right:16px;width:48px;height:48px;object-fit:contain;opacity:${dark ? "0.85" : "0.7"};z-index:20" alt="ibox"/>`

  const accentBar = `<div style="position:absolute;top:0;left:0;right:0;height:4px;background:${GREEN};z-index:10"></div>`

  const footerHtml = (idx: number, total: number, dark = false) =>
    `<div style="position:absolute;bottom:0;left:0;right:0;height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;border-top:1px solid ${dark ? "rgba(255,255,255,0.08)" : "#EBEBEB"};font-size:9px;letter-spacing:0.08em;font-family:${SANS};font-weight:500;text-transform:uppercase;color:${dark ? "rgba(255,255,255,0.22)" : "#BDBDBD"}">
      <span>ibox solutions · frank@ibox.eu.com</span><span>${idx + 1} · ${total}</span>
    </div>`

  const wrapSlide = (inner: string, bg: string) =>
    `<!DOCTYPE html><html><head><style>
      ${FONT_IMPORT}
      *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
      html,body{width:100%;height:100%;overflow:hidden;font-family:${SANS};-webkit-font-smoothing:antialiased}
      .slide{width:100%;height:100%;position:relative;overflow:hidden;background:${bg}}
    </style></head><body><div class="slide">${inner}</div></body></html>`

  const previewHTML = () => {
    if (!currentSlide) return ""
    const s = currentSlide
    const idx = slides.findIndex(sl => sl.id === selectedSlide)
    const total = slides.length
    const bullets = (s.bullets || []).filter(Boolean)
    const theme = (s as any).theme || (s.type === "cover" ? "dark" : "light")
    const isDark = theme === "dark" || s.type === "cta"

    if (s.type === "cover") {
      return wrapSlide(`
        ${accentBar}${logoImg(true)}
        <div style="position:absolute;right:-10px;bottom:-20px;font-family:${SERIF};font-size:240px;color:${isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"};line-height:1;pointer-events:none">${String(idx+1).padStart(2,"0")}</div>
        <div style="padding:44px 52px;height:100%;display:flex;flex-direction:column;justify-content:center">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${GREEN};margin-bottom:18px">${s.label}</div>` : ""}
          <h1 style="font-family:${SERIF};font-size:${isDark?"42px":"40px"};line-height:1.1;color:${isDark?"white":DARK};margin-bottom:14px;font-weight:400;max-width:480px">${s.headline||"Präsentation"}</h1>
          ${s.subheadline ? `<p style="font-size:13px;color:${isDark?"rgba(255,255,255,0.42)":MID};font-weight:300;max-width:380px;line-height:1.6">${s.subheadline}</p>` : ""}
          <div style="width:36px;height:2px;background:${GREEN};margin-top:24px"></div>
        </div>
        ${footerHtml(idx,total,isDark)}
      `, isDark ? DARK : "white")
    }

    if (s.type === "cta") {
      return wrapSlide(`
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.2)"></div>
        ${logoImg(true)}
        <div style="position:absolute;right:0;top:0;bottom:0;width:35%;opacity:0.055"><svg width="100%" height="100%"><defs><pattern id="g" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" stroke-width="0.7"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg></div>
        <div style="padding:48px 60px;height:100%;display:flex;flex-direction:column;justify-content:center;position:relative">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:14px">${s.label}</div>` : ""}
          <h2 style="font-family:${SERIF};font-size:38px;line-height:1.12;color:white;margin-bottom:12px;font-weight:400;max-width:460px">${s.headline||"Jetzt starten"}</h2>
          ${s.text ? `<p style="font-size:12px;color:rgba(255,255,255,0.62);margin-bottom:24px;max-width:400px;line-height:1.65;font-weight:300">${s.text}</p>` : "<div style='height:16px'></div>"}
          <div style="display:inline-block;background:white;color:${GREEN};font-weight:600;font-size:11px;padding:11px 26px;border-radius:4px">${s.ctaText||"Demo-Termin anfragen"}</div>
        </div>
        ${footerHtml(idx,total,true)}
      `, GREEN)
    }

    if (s.type === "bullets") {
      const cols = bullets.length > 4 ? 2 : 1
      return wrapSlide(`
        ${accentBar}${logoImg(false)}
        <div style="padding:42px 52px;height:100%;display:flex;flex-direction:column;justify-content:center">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${GREEN};margin-bottom:14px">${s.label}</div>` : ""}
          <h2 style="font-family:${SERIF};font-size:28px;line-height:1.15;color:${DARK};margin-bottom:${s.subheadline?"6px":"22px"};font-weight:400;max-width:520px">${s.headline||""}</h2>
          ${s.subheadline ? `<p style="font-size:11px;color:${MID};margin-bottom:18px;font-style:italic">${s.subheadline}</p>` : ""}
          <div style="display:grid;grid-template-columns:${cols>1?"1fr 1fr":"1fr"};gap:0 32px;max-width:580px">
            ${bullets.map((b:string,j:number)=>`
              <div style="display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-top:1px solid #F0F0F0">
                <span style="font-family:${SERIF};font-size:17px;color:${GREEN};line-height:1;flex-shrink:0">${String(j+1).padStart(2,"0")}</span>
                <span style="font-size:11.5px;color:#333;line-height:1.5">${b}</span>
              </div>`).join("")}
          </div>
        </div>
        ${footerHtml(idx,total,false)}
      `, "white")
    }

    if (s.type === "comparison") {
      const half = Math.ceil(bullets.length/2)
      const left = bullets.slice(0,half)
      const right = bullets.slice(half)
      return wrapSlide(`
        ${accentBar}${logoImg(false)}
        <div style="padding:38px 48px 44px;height:100%;display:flex;flex-direction:column">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${GREEN};margin-bottom:10px">${s.label}</div>` : ""}
          <h2 style="font-family:${SERIF};font-size:24px;color:${DARK};margin-bottom:20px;font-weight:400">${s.headline||""}</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1">
            <div style="padding-right:28px;border-right:1px solid #E8E8E8">
              <div style="font-size:8px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#AAA;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #E8E8E8">Standard</div>
              ${left.map((b:string)=>`<div style="display:flex;gap:8px;margin-bottom:9px"><span style="color:#CCC;font-size:12px">✕</span><span style="font-size:11px;color:#888;line-height:1.45">${b}</span></div>`).join("")}
            </div>
            <div style="padding-left:28px">
              <div style="font-size:8px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${GREEN};margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid ${GREEN}">ibox</div>
              ${right.map((b:string)=>`<div style="display:flex;gap:8px;margin-bottom:9px"><span style="color:${GREEN};font-size:12px">✓</span><span style="font-size:11px;color:${DARK};line-height:1.45;font-weight:500">${b}</span></div>`).join("")}
            </div>
          </div>
        </div>
        ${footerHtml(idx,total,false)}
      `, "white")
    }

    // Default: content
    return wrapSlide(`
      ${accentBar}${logoImg(false)}
      <div style="display:grid;grid-template-columns:156px 1fr;height:100%">
        <div style="background:${DARK};padding:44px 24px;display:flex;flex-direction:column;justify-content:space-between;position:relative">
          <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${GREEN}"></div>
          ${s.label ? `<div style="font-size:7.5px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${GREEN};line-height:1.6">${s.label}</div>` : "<div></div>"}
          <div style="font-family:${SERIF};font-size:60px;color:rgba(255,255,255,0.06);line-height:1">${String(idx+1).padStart(2,"0")}</div>
        </div>
        <div style="padding:36px 42px;display:flex;flex-direction:column;justify-content:center">
          <h2 style="font-family:${SERIF};font-size:25px;line-height:1.15;color:${DARK};margin-bottom:${s.subheadline?"6px":"18px"};font-weight:400;max-width:440px">${s.headline||""}</h2>
          ${s.subheadline ? `<p style="font-size:11px;color:${MID};margin-bottom:14px;font-style:italic;line-height:1.5">${s.subheadline}</p>` : ""}
          ${s.text ? `<p style="font-size:11.5px;color:#444;line-height:1.7;max-width:420px;margin-bottom:${bullets.length?"14px":"0"}">${s.text}</p>` : ""}
          ${bullets.map((b:string)=>`
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:7px">
              <div style="width:15px;height:15px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px"><div style="width:4px;height:4px;border-radius:50%;background:${GREEN}"></div></div>
              <span style="font-size:11.5px;color:#333;line-height:1.5">${b}</span>
            </div>`).join("")}
        </div>
      </div>
      ${footerHtml(idx,total,false)}
    `, "white")
  }


  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">

      {/* Top Bar */}
      <div className="bg-white border-b border-[#E0E0E0] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/presentations/${id}`} className="text-[#9B9B9B] hover:text-[#1A1A1A] text-sm">← Zurück</Link>
          <span className="text-[#E0E0E0]">|</span>
          <span className="font-semibold text-[#1A1A1A] text-sm truncate max-w-64">{presentation?.title}</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 border border-[#E0E0E0] rounded-lg p-1">
          {(["slides", "sections"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setEditorMode(mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                editorMode === mode ? "bg-[#309E3B] text-white" : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
            >
              {mode === "slides" ? "📊 Folien" : "📄 Sektionen"}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {saveMessage && <span className="text-xs text-[#309E3B]">{saveMessage}</span>}
          <button onClick={save} disabled={isSaving} className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-xs font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition disabled:opacity-50">
            {isSaving ? "Speichert..." : "💾 Speichern"}
          </button>
          <button onClick={exportHTML} className="px-3 py-1.5 bg-[#1A1A1A] text-white rounded-lg text-xs font-medium hover:bg-[#333] transition">
            ⬇ HTML
          </button>
          <button onClick={exportPDF} disabled={isExporting} className="px-3 py-1.5 bg-[#309E3B] text-white rounded-lg text-xs font-medium hover:bg-[#2a8a32] transition disabled:opacity-50">
            {isExporting ? "..." : "⬇ PDF"}
          </button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Slide List */}
        <div className="w-52 bg-[#F5F5F5] border-r border-[#E0E0E0] flex flex-col overflow-hidden">
          <div className="px-3 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
              {slides.length} {editorMode === "slides" ? "Folien" : "Sektionen"}
            </span>
            <button onClick={addSlide} className="text-[#309E3B] hover:text-[#2a8a32] text-lg font-bold leading-none">+</button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                onClick={() => setSelectedSlide(slide.id)}
                className={`group relative rounded-lg p-2.5 cursor-pointer transition ${
                  selectedSlide === slide.id
                    ? "bg-white shadow-sm border border-[#309E3B]"
                    : "hover:bg-white hover:shadow-sm border border-transparent"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#9B9B9B] w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">
                      {SLIDE_TYPES.find(t => t.value === slide.type)?.icon} {slide.headline || "Keine Headline"}
                    </p>
                    {slide.label && <p className="text-[10px] text-[#309E3B] truncate mt-0.5">{slide.label}</p>}
                    <p className="text-[10px] text-[#9B9B9B] truncate">{SLIDE_TYPES.find(t => t.value === slide.type)?.label}</p>
                  </div>
                </div>
                {selectedSlide === slide.id && (
                  <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, "up") }} className="w-5 h-5 text-[10px] bg-[#F5F5F5] rounded hover:bg-[#E0E0E0] flex items-center justify-center">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, "down") }} className="w-5 h-5 text-[10px] bg-[#F5F5F5] rounded hover:bg-[#E0E0E0] flex items-center justify-center">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id) }} className="w-5 h-5 text-[10px] bg-[#F5F5F5] rounded hover:bg-red-100 hover:text-red-600 flex items-center justify-center">✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 bg-[#E8E8E8] flex items-center justify-center overflow-auto p-6">
          <div className="w-full max-w-3xl aspect-video bg-white rounded-lg shadow-xl overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={previewHTML()}
              className="w-full h-full border-0"
              title="Vorschau"
            />
          </div>
        </div>

        {/* Right: Edit Panel */}
        <div className="w-80 bg-white border-l border-[#E0E0E0] flex flex-col overflow-hidden">
          {currentSlide ? (
            <>
              <div className="px-4 py-3 border-b border-[#E0E0E0]">
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2">Folie bearbeiten</p>
                <div className="flex flex-wrap gap-1">
                  {SLIDE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateSlide("type", t.value)}
                      className={`text-xs px-2 py-1 rounded transition ${
                        currentSlide.type === t.value
                          ? "bg-[#309E3B] text-white"
                          : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E0E0E0]"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                {/* Theme toggle for cover */}
                {currentSlide.type === "cover" && (
                  <Field label="Variante">
                    <div className="flex gap-2">
                      {[
                        { value: "dark", label: "Dunkel", bg: "#0F0F0F" },
                        { value: "light", label: "Hell", bg: "#FFFFFF" },
                      ].map((t) => (
                        <button
                          key={t.value}
                          onClick={() => updateSlide("theme", t.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-medium transition ${
                            ((currentSlide as any).theme || "dark") === t.value
                              ? "border-[#309E3B] bg-[#F0F9F1] text-[#309E3B]"
                              : "border-[#E0E0E0] text-[#6B6B6B] hover:border-[#309E3B]"
                          }`}
                        >
                          <span className="w-4 h-4 rounded border border-[#E0E0E0]" style={{ background: t.bg }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                <Field label="Label / Kapitel">
                  <input
                    type="text"
                    value={currentSlide.label || ""}
                    onChange={(e) => updateSlide("label", e.target.value)}
                    placeholder="z.B. DIGITAL SIGNAGE, BUSINESS MODEL..."
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                  />
                </Field>

                <Field label="Headline *">
                  <textarea
                    value={currentSlide.headline || ""}
                    onChange={(e) => updateSlide("headline", e.target.value)}
                    placeholder="Haupttitel der Folie"
                    rows={2}
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                  />
                </Field>

                <Field label="Subheadline">
                  <textarea
                    value={currentSlide.subheadline || ""}
                    onChange={(e) => updateSlide("subheadline", e.target.value)}
                    placeholder="Untertitel oder Ergänzung"
                    rows={2}
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                  />
                </Field>

                <Field label="Text / Beschreibung">
                  <textarea
                    value={currentSlide.text || ""}
                    onChange={(e) => updateSlide("text", e.target.value)}
                    placeholder="Fließtext, Erklärung..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                  />
                </Field>

                {/* Bullets */}
                <Field label="Aufzählungspunkte">
                  <div className="space-y-2">
                    {(currentSlide.bullets || []).map((bullet, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(i, e.target.value)}
                          placeholder={`Punkt ${i + 1}`}
                          className="flex-1 px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                        />
                        <button
                          onClick={() => removeBullet(i)}
                          className="w-7 h-7 text-[#9B9B9B] hover:text-red-500 flex items-center justify-center rounded transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addBullet}
                      className="w-full py-1.5 border border-dashed border-[#309E3B] text-[#309E3B] rounded-lg text-xs font-medium hover:bg-[#F0F9F1] transition"
                    >
                      + Punkt hinzufügen
                    </button>
                  </div>
                </Field>

                {/* CTA Text */}
                {currentSlide.type === "cta" && (
                  <Field label="Button-Text">
                    <input
                      type="text"
                      value={currentSlide.ctaText || ""}
                      onChange={(e) => updateSlide("ctaText", e.target.value)}
                      placeholder="z.B. Demo-Termin anfragen"
                      className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                    />
                  </Field>
                )}

              </div>

              {/* Save Button */}
              <div className="px-4 py-3 border-t border-[#E0E0E0]">
                <button
                  onClick={save}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Speichert..." : "💾 Speichern"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#9B9B9B] text-sm p-8 text-center">
              Wähle eine Folie aus der linken Liste um sie zu bearbeiten.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}
