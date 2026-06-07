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
  const previewHTML = () => {
    if (!currentSlide) return ""
    const idx = slides.findIndex(s => s.id === selectedSlide)
    const total = slides.length
    const slide = currentSlide

    const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`

    const BASE = `
      ${FONTS}
      *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
      :root { --green: #309E3B; --green-light: #E8F5E9; --dark: #0F0F0F; --mid: #6B6B6B; --light: #F5F5F5; --serif: 'DM Serif Display', Georgia, serif; --sans: 'DM Sans', -apple-system, sans-serif; }
      html, body { width: 100%; height: 100%; font-family: var(--sans); -webkit-font-smoothing: antialiased; overflow: hidden; }
      .slide { width: 100%; height: 100%; position: relative; overflow: hidden; }
      .slide::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--green); z-index: 10; }
      .footer { position: absolute; bottom: 0; left: 0; right: 0; height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; border-top: 1px solid; font-size: 9px; letter-spacing: 0.08em; font-family: var(--sans); font-weight: 500; text-transform: uppercase; }
    `

    const bullets = (slide.bullets || []).filter(Boolean)

    if (slide.type === "cover") {
      return `<!DOCTYPE html><html><head><style>${BASE}</style></head><body>
      <div class="slide" style="background:#0F0F0F">
        <div style="position:absolute;right:-10px;bottom:-30px;font-family:var(--serif);font-size:260px;color:rgba(255,255,255,0.03);line-height:1">1</div>
        <div style="padding:40px 50px;height:100%;display:flex;flex-direction:column;justify-content:center">
          ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#309E3B;margin-bottom:20px">${slide.label}</div>` : ""}
          <h1 style="font-family:var(--serif);font-size:42px;line-height:1.1;color:white;margin-bottom:16px;font-weight:400;max-width:480px">${slide.headline || "Präsentation"}</h1>
          ${slide.subheadline ? `<p style="font-size:13px;color:rgba(255,255,255,0.45);font-weight:300;max-width:380px;line-height:1.6">${slide.subheadline}</p>` : ""}
          <div style="width:40px;height:2px;background:#309E3B;margin-top:28px"></div>
        </div>
        <div class="footer" style="border-color:rgba(255,255,255,0.08);color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.03)">
          <span>ibox solutions · frank@ibox.eu.com</span><span>${idx + 1} · ${total}</span>
        </div>
      </div></body></html>`
    }

    if (slide.type === "cta") {
      return `<!DOCTYPE html><html><head><style>${BASE}</style></head><body>
      <div class="slide" style="background:#309E3B">
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.25)"></div>
        <div style="position:absolute;right:0;top:0;bottom:0;width:35%;opacity:0.06">
          <svg width="100%" height="100%"><defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" stroke-width="0.8"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>
        </div>
        <div style="padding:50px 60px;height:100%;display:flex;flex-direction:column;justify-content:center;position:relative">
          ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:16px">${slide.label}</div>` : ""}
          <h2 style="font-family:var(--serif);font-size:40px;line-height:1.15;color:white;margin-bottom:14px;font-weight:400;max-width:460px">${slide.headline || "Jetzt starten"}</h2>
          ${slide.text ? `<p style="font-size:13px;color:rgba(255,255,255,0.65);margin-bottom:28px;max-width:400px;line-height:1.65;font-weight:300">${slide.text}</p>` : `<div style="height:20px"></div>`}
          <div style="display:inline-block;background:white;color:#309E3B;font-weight:600;font-size:12px;padding:12px 28px;border-radius:4px">${slide.ctaText || "Demo-Termin anfragen"}</div>
        </div>
        <div class="footer" style="background:rgba(0,0,0,0.1);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.35)">
          <span>ibox solutions · +43 664 911 24 63</span><span>${idx + 1} · ${total}</span>
        </div>
      </div></body></html>`
    }

    if (slide.type === "bullets") {
      return `<!DOCTYPE html><html><head><style>${BASE}</style></head><body>
      <div class="slide" style="background:white">
        <div style="padding:40px 50px 40px;height:100%;display:flex;flex-direction:column;justify-content:center">
          ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#309E3B;margin-bottom:16px">${slide.label}</div>` : ""}
          <h2 style="font-family:var(--serif);font-size:28px;line-height:1.15;color:#0F0F0F;margin-bottom:${slide.subheadline ? "6px" : "24px"};font-weight:400;max-width:520px">${slide.headline || ""}</h2>
          ${slide.subheadline ? `<p style="font-size:12px;color:#888;margin-bottom:20px;font-style:italic">${slide.subheadline}</p>` : ""}
          <div style="display:grid;grid-template-columns:${bullets.length > 3 ? "1fr 1fr" : "1fr"};gap:0 36px;max-width:600px">
            ${bullets.map((b: string, i: number) => `
              <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-top:1px solid #F0F0F0">
                <span style="font-family:var(--serif);font-size:18px;color:#309E3B;line-height:1;flex-shrink:0">${String(i + 1).padStart(2, "0")}</span>
                <span style="font-size:12px;color:#333;line-height:1.5">${b}</span>
              </div>`).join("")}
          </div>
        </div>
        <div class="footer" style="border-color:#EBEBEB;color:#BDBDBD">
          <span>ibox solutions · frank@ibox.eu.com</span><span>${idx + 1} · ${total}</span>
        </div>
      </div></body></html>`
    }

    if (slide.type === "comparison") {
      const half = Math.ceil(bullets.length / 2)
      const left = bullets.slice(0, half)
      const right = bullets.slice(half)
      return `<!DOCTYPE html><html><head><style>${BASE}</style></head><body>
      <div class="slide" style="background:white">
        <div style="padding:40px 50px;height:100%;display:flex;flex-direction:column">
          ${slide.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#309E3B;margin-bottom:12px">${slide.label}</div>` : ""}
          <h2 style="font-family:var(--serif);font-size:26px;color:#0F0F0F;margin-bottom:20px;font-weight:400">${slide.headline || ""}</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1">
            <div style="padding-right:32px;border-right:1px solid #E8E8E8">
              <div style="font-size:9px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #E8E8E8">Standard</div>
              ${left.map((b: string) => `<div style="display:flex;gap:8px;margin-bottom:10px"><span style="color:#BDBDBD;font-size:13px">✕</span><span style="font-size:11px;color:#888;line-height:1.5">${b}</span></div>`).join("")}
            </div>
            <div style="padding-left:32px;background:rgba(48,158,59,0.03)">
              <div style="font-size:9px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#309E3B;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #309E3B">ibox</div>
              ${right.map((b: string) => `<div style="display:flex;gap:8px;margin-bottom:10px"><span style="color:#309E3B;font-size:13px">✓</span><span style="font-size:11px;color:#0F0F0F;line-height:1.5;font-weight:500">${b}</span></div>`).join("")}
            </div>
          </div>
        </div>
        <div class="footer" style="border-color:#EBEBEB;color:#BDBDBD">
          <span>ibox solutions · frank@ibox.eu.com</span><span>${idx + 1} · ${total}</span>
        </div>
      </div></body></html>`
    }

    // Default: content
    return `<!DOCTYPE html><html><head><style>${BASE}</style></head><body>
    <div class="slide" style="background:white">
      <div style="display:grid;grid-template-columns:160px 1fr;height:100%">
        <div style="background:#0F0F0F;padding:40px 24px;display:flex;flex-direction:column;justify-content:space-between;position:relative">
          <div style="position:absolute;top:0;left:0;right:0;height:4px;background:#309E3B"></div>
          ${slide.label ? `<div style="font-size:8px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#309E3B;line-height:1.5;word-break:break-word">${slide.label}</div>` : "<div></div>"}
          <div style="font-family:var(--serif);font-size:64px;color:rgba(255,255,255,0.07);line-height:1">${String(idx + 1).padStart(2, "0")}</div>
        </div>
        <div style="padding:36px 44px;display:flex;flex-direction:column;justify-content:center">
          <h2 style="font-family:var(--serif);font-size:26px;line-height:1.15;color:#0F0F0F;margin-bottom:${slide.subheadline ? "6px" : "20px"};font-weight:400;max-width:460px">${slide.headline || ""}</h2>
          ${slide.subheadline ? `<p style="font-size:12px;color:#888;margin-bottom:16px;font-style:italic;line-height:1.5">${slide.subheadline}</p>` : ""}
          ${slide.text ? `<p style="font-size:12px;color:#444;line-height:1.75;max-width:440px;margin-bottom:${bullets.length ? "16px" : "0"}">${slide.text}</p>` : ""}
          ${bullets.map((b: string) => `
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">
              <div style="width:16px;height:16px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
                <div style="width:5px;height:5px;border-radius:50%;background:#309E3B"></div>
              </div>
              <span style="font-size:12px;color:#333;line-height:1.5">${b}</span>
            </div>`).join("")}
        </div>
      </div>
      <div class="footer" style="border-color:#EBEBEB;color:#BDBDBD">
        <span>ibox solutions · frank@ibox.eu.com</span><span>${idx + 1} · ${total}</span>
      </div>
    </div></body></html>`
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

                {/* Background for cover */}
                {(currentSlide.type === "cover" || currentSlide.type === "cta") && (
                  <Field label="Hintergrund">
                    <div className="flex gap-2">
                      {["#1A1A1A", "#309E3B", "white", "#F5F5F5"].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateSlide("backgroundColor", color)}
                          className={`w-8 h-8 rounded-lg border-2 transition ${currentSlide.backgroundColor === color ? "border-[#309E3B] scale-110" : "border-transparent"}`}
                          style={{ background: color === "white" ? "#ffffff" : color }}
                        />
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
