"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function NewPresentationPage() {
  const { status } = useSession()
  const router = useRouter()

  const [selectedProductGroup, setSelectedProductGroup] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedProductVersion, setSelectedProductVersion] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [presentationType, setPresentationType] = useState("unbegleitet")
  const [customerCity, setCustomerCity] = useState("")

  const [productGroups, setProductGroups] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productVersions, setProductVersions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiStatus, setAiStatus] = useState<"idle" | "creating" | "generating" | "done">("idle")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pgsRes, catsRes] = await Promise.all([
          fetch("/api/admin/product-groups"),
          fetch("/api/admin/categories"),
        ])
        if (pgsRes.ok) setProductGroups(await pgsRes.json())
        if (catsRes.ok) setCategories(await catsRes.json())
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    if (status === "authenticated") fetchData()
  }, [status])

  useEffect(() => {
    if (!selectedProductGroup) {
      setProducts([])
      setTemplates([])
      setSelectedTemplate("")
      return
    }
    const group = productGroups.find((pg) => pg.id === selectedProductGroup)
    setProducts(group?.products || [])
    setSelectedProduct("")
    setProductVersions([])

    fetch(`/api/admin/templates?productGroupId=${selectedProductGroup}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        const active = data.filter((t) => t.isActive)
        setTemplates(active)
        const standard = active.find((t) => t.isStandard)
        setSelectedTemplate(standard?.id || active[0]?.id || "")
      })
      .catch(console.error)
  }, [selectedProductGroup, productGroups])

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p) => p.id === selectedProduct)
      setProductVersions(product?.versions || [])
      setSelectedProductVersion("")
    }
  }, [selectedProduct, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setAiStatus("creating")

    try {
      // Step 1: Create presentation
      const res = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseProductVersionId: selectedProductVersion,
          baseCategoryId: selectedCategory,
          templateId: selectedTemplate,
          presentationType,
          customerCity,
          title: `${customerCity ? customerCity + " " : ""}Präsentation`,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Fehler beim Erstellen")
        setIsSubmitting(false)
        setAiStatus("idle")
        return
      }

      const presentation = await res.json()

      // Step 2: AI generation in background
      setAiStatus("generating")
      try {
        await fetch(`/api/presentations/${presentation.id}/regenerate`, {
          method: "POST",
        })
      } catch (aiErr) {
        // AI failed — not critical, user can retry on detail page
        console.error("AI generation failed:", aiErr)
      }

      setAiStatus("done")
      setTimeout(() => {
        router.push(`/presentations/${presentation.id}`)
      }, 800)

    } catch (error) {
      console.error("Error:", error)
      setIsSubmitting(false)
      setAiStatus("idle")
    }
  }

  if (isLoading) return <div className="p-8 text-[#6B6B6B]">Laden...</div>

  // AI Loading Screen
  if (aiStatus === "creating" || aiStatus === "generating" || aiStatus === "done") {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#F0F9F1] rounded-full flex items-center justify-center mx-auto mb-6">
            {aiStatus === "done" ? (
              <span className="text-3xl">✅</span>
            ) : (
              <svg className="w-8 h-8 text-[#309E3B] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            {aiStatus === "creating" && "Präsentation wird erstellt..."}
            {aiStatus === "generating" && "KI generiert deinen Content..."}
            {aiStatus === "done" && "Fertig!"}
          </h2>

          <p className="text-sm text-[#6B6B6B] mb-6">
            {aiStatus === "creating" && "Daten werden gespeichert."}
            {aiStatus === "generating" && `Claude analysiert das Produkt und die Branche und erstellt einen individuellen HTML-Content für ${customerCity || "den Kunden"}.`}
            {aiStatus === "done" && "Weiterleitung zur Präsentation..."}
          </p>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3 text-xs">
            <Step label="Erstellen" done={aiStatus !== "creating"} active={aiStatus === "creating"} />
            <div className="w-8 h-px bg-[#E0E0E0]" />
            <Step label="KI generiert" done={aiStatus === "done"} active={aiStatus === "generating"} />
            <div className="w-8 h-px bg-[#E0E0E0]" />
            <Step label="Fertig" done={aiStatus === "done"} active={false} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Neue Präsentation</h1>
          <p className="text-[#6B6B6B] mt-1">
            Füll das Formular aus — Claude generiert danach automatisch den Content.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1. Produktgruppe */}
          <Section number={1} title="Produkt wählen">
            <FormSelect
              label="Produktgruppe"
              value={selectedProductGroup}
              onChange={setSelectedProductGroup}
              required
              options={productGroups.map((pg) => ({ value: pg.id, label: pg.name }))}
              placeholder="-- Wähle eine Produktgruppe --"
            />

            {selectedProductGroup && (
              <FormSelect
                label="Produkt"
                value={selectedProduct}
                onChange={setSelectedProduct}
                required
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="-- Wähle ein Produkt --"
              />
            )}

            {selectedProduct && (
              <FormSelect
                label="Produktversion"
                value={selectedProductVersion}
                onChange={setSelectedProductVersion}
                required
                options={productVersions.map((pv) => ({ value: pv.id, label: pv.version }))}
                placeholder="-- Wähle eine Version --"
              />
            )}
          </Section>

          {/* 2. Template */}
          {selectedProductGroup && templates.length > 0 && (
            <Section number={2} title="Template wählen">
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <label
                    key={tpl.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                      selectedTemplate === tpl.id
                        ? "border-[#309E3B] bg-[#F0F9F1]"
                        : "border-[#E0E0E0] hover:bg-[#F5F5F5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={tpl.id}
                      checked={selectedTemplate === tpl.id}
                      onChange={() => setSelectedTemplate(tpl.id)}
                      className="w-4 h-4 mt-1 accent-[#309E3B]"
                    />
                    <div className="ml-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#1A1A1A]">{tpl.name}</p>
                        {tpl.isStandard && (
                          <span className="text-xs px-2 py-0.5 bg-[#309E3B] text-white rounded-full">Standard</span>
                        )}
                      </div>
                      {tpl.description && <p className="text-sm text-[#6B6B6B] mt-1">{tpl.description}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </Section>
          )}

          {/* 3. Branche */}
          <Section number={3} title="Branche wählen">
            <FormSelect
              label="Branche"
              value={selectedCategory}
              onChange={setSelectedCategory}
              required
              options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
              placeholder="-- Wähle eine Branche --"
            />
          </Section>

          {/* 4. Typ */}
          <Section number={4} title="Präsentationstyp">
            <div className="space-y-3">
              {[
                {
                  value: "unbegleitet",
                  label: "Unbegleitet",
                  desc: "Selbsterklärend, detailliert – zum Versenden per Email/PDF",
                },
                {
                  value: "begleitet",
                  label: "Begleitet",
                  desc: "Visuell, minimal Text – für Sales Pitch mit Sprecher",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                    presentationType === opt.value
                      ? "border-[#309E3B] bg-[#F0F9F1]"
                      : "border-[#E0E0E0] hover:bg-[#F5F5F5]"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={presentationType === opt.value}
                    onChange={(e) => setPresentationType(e.target.value)}
                    className="w-4 h-4 accent-[#309E3B]"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-[#1A1A1A]">{opt.label}</p>
                    <p className="text-sm text-[#6B6B6B]">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* 5. Kunde */}
          <Section number={5} title="Kundendetails">
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Kundenstadt</label>
            <input
              type="text"
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              placeholder="z.B. Wien, München, Zürich..."
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
            />
          </Section>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !selectedProductVersion || !selectedCategory || !selectedTemplate}
              className="w-full bg-[#309E3B] hover:bg-[#2a8a32] text-white font-semibold py-3.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Präsentation erstellen & KI generieren
            </button>
            <p className="text-xs text-center text-[#9B9B9B] mt-2">
              Claude generiert automatisch branchen- und kundenspezifischen Content
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-[#309E3B] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </div>
  )
}

function FormSelect({
  label, value, onChange, required, options, placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function Step({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
        done ? "bg-[#309E3B] text-white" : active ? "bg-[#309E3B] text-white animate-pulse" : "bg-[#E0E0E0] text-[#9B9B9B]"
      }`}>
        {done ? "✓" : ""}
      </div>
      <span className={`text-xs ${active || done ? "text-[#309E3B]" : "text-[#9B9B9B]"}`}>{label}</span>
    </div>
  )
}
