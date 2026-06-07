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
    const bg = currentSlide.backgroundColor || (currentSlide.type === "cover" ? "#1A1A1A" : "white")
    const textColor = bg === "#1A1A1A" ? "white" : "#1A1A1A"
    const bullets = (currentSlide.bullets || []).filter(Boolean).map((b) =>
      `<li style="padding:6px 0;padding-left:20px;position:relative;font-size:14px;color:${textColor === "white" ? "#ccc" : "#444"}">
        <span style="position:absolute;left:0;color:#309E3B;font-weight:bold">→</span>${b}
      </li>`
    ).join("")

    return `<!DOCTYPE html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${bg};width:100%;height:100vh;display:flex;flex-direction:column;padding:40px 50px;justify-content:${currentSlide.type === "cover" ? "center" : "flex-start"};align-items:${currentSlide.type === "cover" ? "center" : "flex-start"};text-align:${currentSlide.type === "cover" ? "center" : "left"}}
    </style></head><body>
      ${currentSlide.label ? `<div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#309E3B;margin-bottom:16px">${currentSlide.label}</div>` : ""}
      ${currentSlide.headline ? `<h1 style="font-size:${currentSlide.type === "cover" ? "2.5rem" : "1.8rem"};font-weight:800;color:${textColor};line-height:1.15;margin-bottom:14px;max-width:700px">${currentSlide.headline}</h1>` : ""}
      ${currentSlide.subheadline ? `<p style="font-size:1rem;color:${textColor === "white" ? "#999" : "#555"};margin-bottom:20px;max-width:600px">${currentSlide.subheadline}</p>` : ""}
      ${currentSlide.text ? `<p style="font-size:13px;color:${textColor === "white" ? "#aaa" : "#555"};line-height:1.7;max-width:700px;margin-bottom:16px">${currentSlide.text}</p>` : ""}
      ${bullets ? `<ul style="list-style:none;margin-top:12px;width:100%;max-width:700px">${bullets}</ul>` : ""}
      ${currentSlide.type === "cta" ? `<div style="margin-top:28px;display:inline-block;background:#309E3B;color:white;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px">${currentSlide.ctaText || "Jetzt Kontakt aufnehmen"}</div>` : ""}
      <div style="position:fixed;bottom:16px;left:50px;right:50px;display:flex;justify-content:space-between;font-size:9px;color:${textColor === "white" ? "#555" : "#bbb"}">
        <span>ibox solutions | frank@ibox.eu.com</span>
        <span>${(slides.findIndex(s => s.id === selectedSlide) + 1)} / ${slides.length}</span>
      </div>
    </body></html>`
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
