"use client"

import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"

export default function PresentationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const [presentation, setPresentation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("slide")
  const [dropdownOpen, setDropdownOpen] = useState<"pdf" | "html" | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenMessage, setRegenMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        const res = await fetch(`/api/presentations/${params.id}`)
        if (res.ok) {
          setPresentation(await res.json())
        } else {
          router.push("/presentations")
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated" && params.id) {
      fetchPresentation()
    }
  }, [status, params.id, router])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleRegenerate = async () => {
    if (!confirm("Präsentation mit KI neu generieren? Der aktuelle Inhalt wird überschrieben.")) return
    setIsRegenerating(true)
    setRegenMessage(null)
    try {
      const res = await fetch(`/api/presentations/${params.id}/regenerate`, {
        method: "POST",
      })
      if (res.ok) {
        const data = await res.json()
        setPresentation(data.presentation)
        setRegenMessage({ type: "success", text: "✅ Präsentation erfolgreich mit KI neu generiert." })
      } else {
        const err = await res.json()
        setRegenMessage({ type: "error", text: `❌ Fehler: ${err.error || "Unbekannter Fehler"}` })
      }
    } catch (e) {
      setRegenMessage({ type: "error", text: "❌ Netzwerkfehler. Bitte nochmal versuchen." })
    } finally {
      setIsRegenerating(false)
      setTimeout(() => setRegenMessage(null), 6000)
    }
  }

  const handlePDFDownload = () => {
    const html = activeTab === "slide" ? presentation.htmlSlide : presentation.htmlWebsite
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
    setDropdownOpen(null)
  }

  const handleHTMLDownload = () => {
    const html = activeTab === "slide" ? presentation.htmlSlide : presentation.htmlWebsite
    const filename = `${presentation.title.replace(/\s+/g, "-")}-${activeTab}.html`
    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setDropdownOpen(null)
  }

  const handleMailto = () => {
    const subject = encodeURIComponent(`ibox Präsentation – ${presentation.title}`)
    const body = encodeURIComponent(
      `Guten Tag,\n\nanbei übermittle ich Ihnen die ibox Präsentation für ${presentation.customerCity}.\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setDropdownOpen(null)
  }

  if (isLoading) return <div className="p-8">Laden...</div>
  if (!presentation) return <div className="p-8">Nicht gefunden</div>

  const DropdownItem = ({
    label,
    onClick,
    disabled = false,
    comingSoon = false,
  }: {
    label: string
    onClick?: () => void
    disabled?: boolean
    comingSoon?: boolean
  }) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition
        ${disabled
          ? "text-[#B0B0B0] cursor-not-allowed"
          : "text-[#1A1A1A] hover:bg-[#F5F5F5] cursor-pointer"
        }`}
    >
      {label}
      {comingSoon && (
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0E0E0] text-[#6B6B6B]">
          Coming soon
        </span>
      )}
    </button>
  )

  return (
    <div className="bg-[#F5F5F5] flex-1">
      <header className="bg-white border-b border-[#E0E0E0]">
        <div className="px-6 py-5 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] mt-2">{presentation.title}</h1>
            <p className="text-[#6B6B6B]">{presentation.customerCity}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2 items-center" ref={dropdownRef}>

            {/* AI Regenerate Button */}
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className={`flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg transition text-sm border-2
                ${isRegenerating
                  ? "border-[#309E3B] text-[#309E3B] bg-[#F0F9F1] cursor-not-allowed"
                  : "border-[#309E3B] text-[#309E3B] bg-white hover:bg-[#F0F9F1]"
                }`}
              title="Präsentation mit KI neu generieren"
            >
              {isRegenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  KI generiert...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  KI neu generieren
                </>
              )}
            </button>

            {/* PDF Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(dropdownOpen === "pdf" ? null : "pdf")}
                className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white font-medium px-4 py-2.5 rounded-lg transition text-sm"
              >
                PDF
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen === "pdf" && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-[#E0E0E0] z-50 overflow-hidden">
                  <div className="px-4 py-2 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide border-b border-[#E0E0E0]">
                    PDF Aktionen
                  </div>
                  <DropdownItem label="⬇ PDF herunterladen" onClick={handlePDFDownload} />
                  <DropdownItem label="✉ Per Mail senden" onClick={handleMailto} />
                  <div className="border-t border-[#E0E0E0]">
                    <DropdownItem label="📁 In Google Drive ablegen" disabled comingSoon />
                  </div>
                </div>
              )}
            </div>

            {/* HTML Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(dropdownOpen === "html" ? null : "html")}
                className="flex items-center gap-2 bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-4 py-2.5 rounded-lg transition text-sm"
              >
                HTML
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen === "html" && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-[#E0E0E0] z-50 overflow-hidden">
                  <div className="px-4 py-2 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide border-b border-[#E0E0E0]">
                    HTML Aktionen
                  </div>
                  <DropdownItem label="⬇ HTML herunterladen" onClick={handleHTMLDownload} />
                  <DropdownItem label="✉ Per Mail senden" onClick={handleMailto} />
                  <div className="border-t border-[#E0E0E0]">
                    <DropdownItem label="🌐 Veröffentlichen" disabled comingSoon />
                    <DropdownItem label="🌐 Veröffentlichen + Mail" disabled comingSoon />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Regen message bar */}
        {regenMessage && (
          <div className={`px-6 py-3 text-sm font-medium ${
            regenMessage.type === "success"
              ? "bg-[#F0F9F1] text-[#309E3B] border-t border-[#309E3B]/20"
              : "bg-red-50 text-red-700 border-t border-red-200"
          }`}>
            {regenMessage.text}
          </div>
        )}
      </header>

      <main className="px-6 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-[#E0E0E0] flex">
            <button
              onClick={() => setActiveTab("slide")}
              className={`flex-1 px-6 py-4 text-center font-medium ${activeTab === "slide" ? "border-b-2 border-[#309E3B] text-[#309E3B]" : "text-[#6B6B6B]"}`}
            >
              Slide (Pitch)
            </button>
            <button
              onClick={() => setActiveTab("website")}
              className={`flex-1 px-6 py-4 text-center font-medium ${activeTab === "website" ? "border-b-2 border-[#309E3B] text-[#309E3B]" : "text-[#6B6B6B]"}`}
            >
              Website
            </button>
          </div>

          <div className="w-full">
            <iframe
              srcDoc={activeTab === "slide" ? presentation.htmlSlide : presentation.htmlWebsite}
              className="w-full border-0"
              style={{ height: "600px" }}
              title="Preview"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-[#6B6B6B]">Typ</p>
            <p className="font-semibold text-[#1A1A1A]">
              {presentation.presentationType === "begleitet" ? "Begleitet" : "Unbegleitet"}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-[#6B6B6B]">Status</p>
            <p className="font-semibold text-[#1A1A1A]">{presentation.status}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-[#6B6B6B]">Erstellt</p>
            <p className="font-semibold text-[#1A1A1A]">
              {new Date(presentation.createdAt).toLocaleDateString("de-DE")}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-[#6B6B6B]">Zuletzt aktualisiert</p>
            <p className="font-semibold text-[#1A1A1A]">
              {new Date(presentation.updatedAt).toLocaleDateString("de-DE")}
            </p>
          </div>
        </div>

        {/* AI Info Box */}
        <div className="mt-6 bg-white rounded-lg shadow p-6 border-l-4 border-[#309E3B]">
          <h3 className="font-semibold text-[#1A1A1A] mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#309E3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            KI-Generierung verfügbar
          </h3>
          <p className="text-sm text-[#6B6B6B]">
            Mit dem Button <strong>"KI neu generieren"</strong> erstellt Claude automatisch einen
            professionellen, branchen- und kundenspezifischen HTML-Content für diese Präsentation —
            basierend auf dem ibox Markenwissen. Produkt, Branche und Kundenstadt werden berücksichtigt.
          </p>
        </div>
      </main>
    </div>
  )
}
