"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

const AVAILABLE_PLACEHOLDERS = [
  { key: "productName", description: "Produktname" },
  { key: "productDescription", description: "Produktbeschreibung" },
  { key: "productGroupName", description: "Produktgruppe" },
  { key: "categoryName", description: "Branche" },
  { key: "customerCity", description: "Kundenstadt" },
  { key: "createdDate", description: "Erstelldatum" },
  { key: "version", description: "Produktversion" },
]

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [htmlSlide, setHtmlSlide] = useState("")
  const [htmlWebsite, setHtmlWebsite] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  const [activeTab, setActiveTab] = useState<"slide" | "website">("slide")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [mockData, setMockData] = useState({
    productName: "iboard Pro 65",
    productDescription: "Eine moderne 65 Zoll Touchscreen Lösung für interaktive Kommunikation.",
    categoryName: "Gastronomie",
    customerCity: "Wien",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${params.id}`)
        if (res.ok) {
          const t = await res.json()
          setTemplate(t)
          setName(t.name)
          setDescription(t.description || "")
          setHtmlSlide(t.htmlSlide)
          setHtmlWebsite(t.htmlWebsite)
          setIsActive(t.isActive)
        } else {
          router.push("/admin/templates")
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params.id, router])

  const updatePreview = useCallback(async () => {
    if (!template) return
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/admin/templates/draft/preview?variant=${activeTab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlSlide,
          htmlWebsite,
          ...mockData,
        }),
      })
      if (res.ok) {
        const rendered = await res.text()
        setPreviewHtml(rendered)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPreviewLoading(false)
    }
  }, [template, activeTab, htmlSlide, htmlWebsite, mockData])

  useEffect(() => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current)
    previewTimeoutRef.current = setTimeout(updatePreview, 500)
    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current)
    }
  }, [updatePreview])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/templates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          htmlSlide,
          htmlWebsite,
          isActive,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTemplate(updated)
        setHasChanges(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const insertPlaceholder = (key: string) => {
    const placeholder = `{{${key}}}`
    navigator.clipboard.writeText(placeholder)
  }

  useEffect(() => {
    if (!template) return
    setHasChanges(
      name !== template.name ||
      description !== (template.description || "") ||
      htmlSlide !== template.htmlSlide ||
      htmlWebsite !== template.htmlWebsite ||
      isActive !== template.isActive
    )
  }, [name, description, htmlSlide, htmlWebsite, isActive, template])

  if (isLoading) return <div className="p-8">Laden...</div>
  if (!template) return <div className="p-8">Template nicht gefunden</div>

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <header className="bg-white shadow z-10">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link
              href="/admin/templates"
              className="text-[#309E3B] text-sm whitespace-nowrap"
            >
              ← Templates
            </Link>
            <div className="border-l border-[#E0E0E0] pl-4 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg font-semibold text-[#1A1A1A] bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-[#309E3B] rounded px-2 py-1 flex-1 min-w-0"
                />
                {template.isStandard && (
                  <span className="text-xs px-2 py-1 bg-[#309E3B] text-white rounded-full whitespace-nowrap">
                    ⭐ Standard
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-1 px-2">
                <span className="text-xs px-2 py-0.5 bg-[#F5F5F5] rounded text-[#6B6B6B]">
                  📦 {template.productGroup?.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#6B6B6B]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[#309E3B]"
              />
              Aktiv
            </label>
            {hasChanges && (
              <span className="text-xs text-amber-600">● Ungespeichert</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSaving ? "Speichere..." : "Speichern"}
            </button>
          </div>
        </div>

        <div className="border-t border-[#E0E0E0] flex">
          <button
            onClick={() => setActiveTab("slide")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "slide"
                ? "border-b-2 border-[#309E3B] text-[#309E3B]"
                : "text-[#6B6B6B] hover:text-[#1A1A1A]"
            }`}
          >
            Slide (Pitch)
          </button>
          <button
            onClick={() => setActiveTab("website")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "website"
                ? "border-b-2 border-[#309E3B] text-[#309E3B]"
                : "text-[#6B6B6B] hover:text-[#1A1A1A]"
            }`}
          >
            Website
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 flex flex-col border-r border-[#E0E0E0]">
          <div className="px-4 py-2 bg-[#1E1E1E] text-white text-xs font-mono flex items-center justify-between">
            <span>{activeTab === "slide" ? "htmlSlide" : "htmlWebsite"}</span>
            <span className="text-[#888]">HTML</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={activeTab === "slide" ? htmlSlide : htmlWebsite}
              onChange={(value) => {
                if (activeTab === "slide") setHtmlSlide(value || "")
                else setHtmlWebsite(value || "")
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="bg-white border-b border-[#E0E0E0] p-3">
            <div className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2">
              Vorschau-Daten
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(mockData).map(([key, value]) => (
                <input
                  key={key}
                  type="text"
                  value={value}
                  onChange={(e) =>
                    setMockData({ ...mockData, [key]: e.target.value })
                  }
                  placeholder={key}
                  className="text-xs px-2 py-1 border border-[#E0E0E0] rounded focus:outline-none focus:ring-1 focus:ring-[#309E3B]"
                />
              ))}
            </div>
          </div>

          <div className="flex-1 bg-[#F5F5F5] relative">
            {previewLoading && (
              <div className="absolute top-2 right-2 z-10 bg-[#1A1A1A] text-white text-xs px-2 py-1 rounded opacity-70">
                Aktualisiere...
              </div>
            )}
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              title="Live Preview"
              sandbox="allow-same-origin"
            />
          </div>

          <div className="bg-white border-t border-[#E0E0E0] p-3 max-h-48 overflow-y-auto">
            <div className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2">
              Verfügbare Platzhalter (klicken zum Kopieren)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {AVAILABLE_PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => insertPlaceholder(p.key)}
                  className="text-left px-2 py-1.5 rounded hover:bg-[#F5F5F5] transition group"
                  title={p.description}
                >
                  <code className="text-xs text-[#309E3B] font-mono">
                    {`{{${p.key}}}`}
                  </code>
                  <span className="block text-xs text-[#9B9B9B] truncate">
                    {p.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-[#E0E0E0] px-6 py-3">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung (optional)"
          className="w-full text-sm text-[#6B6B6B] bg-transparent border-0 focus:outline-none"
        />
      </div>
    </div>
  )
}
