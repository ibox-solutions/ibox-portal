"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function NewPresentationPage() {
  const { status } = useSession()
  const router = useRouter()

  // Product
  const [productMode, setProductMode] = useState<"select" | "custom">("select")
  const [selectedProductGroup, setSelectedProductGroup] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedProductVersion, setSelectedProductVersion] = useState("")
  const [customProductText, setCustomProductText] = useState("")

  // Template
  const [selectedTemplate, setSelectedTemplate] = useState("")

  // Customer
  const [customerName, setCustomerName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [customerWebsite, setCustomerWebsite] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")

  // Type
  const [presentationType, setPresentationType] = useState("unbegleitet")

  // Data
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
    if (status !== "authenticated") return
    Promise.all([
      fetch("/api/admin/product-groups").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([pgs, cats]) => {
      setProductGroups(pgs)
      setCategories(cats)
    }).finally(() => setIsLoading(false))
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
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const active = data.filter((t) => t.isActive)
        setTemplates(active)
        const standard = active.find((t) => t.isStandard)
        setSelectedTemplate(standard?.id || active[0]?.id || "")
      })
  }, [selectedProductGroup, productGroups])

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p) => p.id === selectedProduct)
      setProductVersions(product?.versions || [])
      setSelectedProductVersion("")
    }
  }, [selectedProduct, products])

  const canSubmit = () => {
    if (!selectedCategory) return false
    if (productMode === "select" && !selectedProductVersion) return false
    if (productMode === "custom" && !customProductText.trim()) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit()) return
    setIsSubmitting(true)
    setAiStatus("creating")

    try {
      const body: any = {
        baseCategoryId: selectedCategory,
        templateId: selectedTemplate || undefined,
        presentationType,
        customerName: customerName.trim() || undefined,
        customerWebsite: customerWebsite.trim() || undefined,
        additionalInfo: additionalInfo.trim() || undefined,
        title: customerName.trim()
          ? `${customerName.trim()} Präsentation`
          : "ibox Präsentation",
      }

      if (productMode === "select") {
        body.baseProductVersionId = selectedProductVersion
      } else {
        body.customProductText = customProductText.trim()
        // For custom mode, use first available product version as base
        body.baseProductVersionId = null
      }

      const res = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Fehler beim Erstellen")
        setIsSubmitting(false)
        setAiStatus("idle")
        return
      }

      const presentation = await res.json()
      setAiStatus("generating")

      try {
        await fetch(`/api/presentations/${presentation.id}/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: customerName.trim() || undefined,
            customerWebsite: customerWebsite.trim() || undefined,
            additionalInfo: additionalInfo.trim() || undefined,
            customProductText: productMode === "custom" ? customProductText.trim() : undefined,
          }),
        })
      } catch (aiErr) {
        console.error("AI generation failed:", aiErr)
      }

      setAiStatus("done")
      setTimeout(() => router.push(`/presentations/${presentation.id}`), 800)
    } catch (error) {
      console.error("Error:", error)
      setIsSubmitting(false)
      setAiStatus("idle")
    }
  }

  if (isLoading) return <div className="p-8 text-[#6B6B6B]">Laden...</div>

  if (aiStatus !== "idle") {
    return (
      <div className="flex-1 bg-[#F5F5F5] flex items-center justify-center">
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
            {aiStatus === "generating" && `Claude analysiert ${customerName ? customerName + " —" : ""} Produkt, Branche${customerWebsite ? ", Website-CI" : ""} und erstellt einen individuellen Content.`}
            {aiStatus === "done" && "Weiterleitung zur Präsentation..."}
          </p>
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
    <div className="flex-1 bg-[#F5F5F5] py-10 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Neue Präsentation</h1>
          <p className="text-[#6B6B6B] mt-1">Claude generiert automatisch branchen- und kundenspezifischen Content.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1. Kundendetails */}
          <Section number={1} title="Kundendetails">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Name des Kunden / Unternehmens
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="z.B. REWE Group, Stadtgemeinde Wien, Hotel Sacher..."
                  className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Branche <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
                >
                  <option value="">-- Branche wählen --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Website des Kunden
                  <span className="ml-2 text-xs font-normal text-[#9B9B9B]">Die KI liest die CI und passt den Stil an</span>
                </label>
                <input
                  type="url"
                  value={customerWebsite}
                  onChange={(e) => setCustomerWebsite(e.target.value)}
                  placeholder="https://www.kundenwebsite.at"
                  className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Zusatzinformationen für die KI
                  <span className="ml-2 text-xs font-normal text-[#9B9B9B]">Kontext, Besonderheiten, spezifische Wünsche</span>
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="z.B. Kunde hat bereits 3 Standorte in Wien, interessiert sich besonders für Revenue Share Modell, CEO ist sehr datenschutzsensibel, Präsentation für Vorstandssitzung am 15...."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                />
              </div>
            </div>
          </Section>

          {/* 2. Produkt */}
          <Section number={2} title="Produkt">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setProductMode("select")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition ${
                  productMode === "select"
                    ? "border-[#309E3B] bg-[#F0F9F1] text-[#309E3B]"
                    : "border-[#E0E0E0] text-[#6B6B6B] hover:border-[#309E3B]"
                }`}
              >
                📦 Aus Produktkatalog wählen
              </button>
              <button
                type="button"
                onClick={() => setProductMode("custom")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition ${
                  productMode === "custom"
                    ? "border-[#309E3B] bg-[#F0F9F1] text-[#309E3B]"
                    : "border-[#E0E0E0] text-[#6B6B6B] hover:border-[#309E3B]"
                }`}
              >
                ✏️ Frei beschreiben
              </button>
            </div>

            {productMode === "select" ? (
              <div className="space-y-3">
                <FormSelect
                  label="Produktgruppe"
                  value={selectedProductGroup}
                  onChange={setSelectedProductGroup}
                  options={productGroups.map((pg) => ({ value: pg.id, label: pg.name }))}
                  placeholder="-- Produktgruppe wählen --"
                />
                {selectedProductGroup && (
                  <FormSelect
                    label="Produkt"
                    value={selectedProduct}
                    onChange={setSelectedProduct}
                    options={products.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder="-- Produkt wählen --"
                  />
                )}
                {selectedProduct && (
                  <FormSelect
                    label="Version"
                    value={selectedProductVersion}
                    onChange={setSelectedProductVersion}
                    options={productVersions.map((pv) => ({ value: pv.id, label: pv.version }))}
                    placeholder="-- Version wählen --"
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Produkt(e) beschreiben
                  <span className="ml-2 text-xs font-normal text-[#9B9B9B]">Kombinationen, Sonderkonfigurationen, Custom</span>
                </label>
                <textarea
                  value={customProductText}
                  onChange={(e) => setCustomProductText(e.target.value)}
                  placeholder="z.B. 3× ibox.city Standard + 1× ibox.city mit Solar-Option für Außenbereich, kombiniert mit ibox.board 65″ für Innenbereich-Empfang. Fokus auf Revenue Share Modell..."
                  rows={4}
                  required={productMode === "custom"}
                  className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                />
              </div>
            )}
          </Section>

          {/* 3. Template */}
          {selectedProductGroup && templates.length > 0 && (
            <Section number={3} title="Template">
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <label
                    key={tpl.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
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
                      className="w-4 h-4 accent-[#309E3B]"
                    />
                    <div className="ml-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#1A1A1A] text-sm">{tpl.name}</p>
                        {tpl.isStandard && (
                          <span className="text-xs px-2 py-0.5 bg-[#309E3B] text-white rounded-full">Standard</span>
                        )}
                      </div>
                      {tpl.description && <p className="text-xs text-[#6B6B6B] mt-0.5">{tpl.description}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </Section>
          )}

          {/* 4. Typ */}
          <Section number={productMode === "select" && selectedProductGroup && templates.length > 0 ? 4 : 3} title="Präsentationstyp">
            <div className="space-y-2">
              {[
                { value: "unbegleitet", label: "Unbegleitet", desc: "Selbsterklärend — zum Versenden per Email/PDF" },
                { value: "begleitet", label: "Begleitet", desc: "Minimal & visuell — für Sales Pitch mit Sprecher" },
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
                    <p className="font-medium text-[#1A1A1A] text-sm">{opt.label}</p>
                    <p className="text-xs text-[#6B6B6B]">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit()}
              className="w-full bg-[#309E3B] hover:bg-[#2a8a32] text-white font-semibold py-3.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Präsentation erstellen & KI generieren
            </button>
            <p className="text-xs text-center text-[#9B9B9B] mt-2">
              Claude generiert automatisch individuellen Content für diesen Kunden
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#309E3B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </div>
  )
}

function FormSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
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
