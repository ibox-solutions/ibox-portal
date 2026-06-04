"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function NewPresentationPage() {
  const { status } = useSession()
  const router = useRouter()
  
  // Form State
  const [selectedProductGroup, setSelectedProductGroup] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedProductVersion, setSelectedProductVersion] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [presentationType, setPresentationType] = useState("unbegleitet")
  const [customerCity, setCustomerCity] = useState("")
  
  // Data State
  const [productGroups, setProductGroups] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productVersions, setProductVersions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([]) // Templates for selected ProductGroup
  
  // UI State
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    if (status === "authenticated") {
      fetchData()
    }
  }, [status])

  // When ProductGroup changes: reset products + load templates
  useEffect(() => {
    if (!selectedProductGroup) {
      setProducts([])
      setTemplates([])
      setSelectedTemplate("")
      return
    }
    const group = productGroups.find(pg => pg.id === selectedProductGroup)
    setProducts(group?.products || [])
    setSelectedProduct("")
    setProductVersions([])

    // Load templates for this product group
    fetch(`/api/admin/templates?productGroupId=${selectedProductGroup}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        // Only active templates
        const active = data.filter(t => t.isActive)
        setTemplates(active)
        // Default: select the standard
        const standard = active.find(t => t.isStandard)
        setSelectedTemplate(standard?.id || (active[0]?.id ?? ""))
      })
      .catch(e => console.error(e))
  }, [selectedProductGroup, productGroups])

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p.id === selectedProduct)
      setProductVersions(product?.versions || [])
      setSelectedProductVersion("")
    }
  }, [selectedProduct, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseProductVersionId: selectedProductVersion,
          baseCategoryId: selectedCategory,
          templateId: selectedTemplate,
          presentationType,
          customerCity,
          title: `${customerCity || "Neue"} Präsentation`,
        })
      })

      if (res.ok) {
        const presentation = await res.json()
        router.push(`/presentations/${presentation.id}`)
      } else {
        const err = await res.json()
        alert(err.error || "Fehler beim Erstellen")
      }
    } catch (error) {
      console.error("Error creating presentation:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "unauthenticated") {
    router.push("/auth/login")
    return null
  }

  if (isLoading) {
    return <div className="p-8">Laden...</div>
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
          Neue Präsentation
        </h1>
        <p className="text-[#6B6B6B] mb-8">
          Erstelle eine neue ibox Präsentation für einen Kunden
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Product */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              1. Produkt wählen
            </h2>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Produktgruppe
              </label>
              <select
                value={selectedProductGroup}
                onChange={(e) => setSelectedProductGroup(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
              >
                <option value="">-- Wähle eine Produktgruppe --</option>
                {productGroups.map((pg) => (
                  <option key={pg.id} value={pg.id}>
                    {pg.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProductGroup && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Produkt
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                >
                  <option value="">-- Wähle ein Produkt --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProduct && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Produktversion
                </label>
                <select
                  value={selectedProductVersion}
                  onChange={(e) => setSelectedProductVersion(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                >
                  <option value="">-- Wähle eine Version --</option>
                  {productVersions.map((pv) => (
                    <option key={pv.id} value={pv.id}>
                      {pv.version}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Template */}
          {selectedProductGroup && templates.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                2. Template wählen
              </h2>
              <div className="space-y-2">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id
                  return (
                    <label
                      key={tpl.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                        isSelected
                          ? "border-[#309E3B] bg-[#F0F9F1]"
                          : "border-[#E0E0E0] hover:bg-[#F5F5F5]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={tpl.id}
                        checked={isSelected}
                        onChange={() => setSelectedTemplate(tpl.id)}
                        className="w-4 h-4 mt-1 accent-[#309E3B]"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1A1A1A]">{tpl.name}</p>
                          {tpl.isStandard && (
                            <span className="text-xs px-2 py-0.5 bg-[#309E3B] text-white rounded-full">
                              Standard
                            </span>
                          )}
                        </div>
                        {tpl.description && (
                          <p className="text-sm text-[#6B6B6B] mt-1">{tpl.description}</p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* 3. Category */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
              3. Branche wählen
            </h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
            >
              <option value="">-- Wähle eine Branche --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Presentation Type */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
              4. Präsentationstyp
            </h2>
            <div className="space-y-3">
              <label
                className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-[#F5F5F5]"
                style={{ borderColor: presentationType === "unbegleitet" ? "#309E3B" : "#E0E0E0" }}
              >
                <input
                  type="radio"
                  name="type"
                  value="unbegleitet"
                  checked={presentationType === "unbegleitet"}
                  onChange={(e) => setPresentationType(e.target.value)}
                  className="w-4 h-4 accent-[#309E3B]"
                />
                <div className="ml-3">
                  <p className="font-medium text-[#1A1A1A]">Unbegleitet</p>
                  <p className="text-sm text-[#6B6B6B]">
                    Selbsterklärend, detailliert – zum Versenden per Email/PDF
                  </p>
                </div>
              </label>

              <label
                className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-[#F5F5F5]"
                style={{ borderColor: presentationType === "begleitet" ? "#309E3B" : "#E0E0E0" }}
              >
                <input
                  type="radio"
                  name="type"
                  value="begleitet"
                  checked={presentationType === "begleitet"}
                  onChange={(e) => setPresentationType(e.target.value)}
                  className="w-4 h-4 accent-[#309E3B]"
                />
                <div className="ml-3">
                  <p className="font-medium text-[#1A1A1A]">Begleitet</p>
                  <p className="text-sm text-[#6B6B6B]">
                    Visuell, minimal Text – für Sales Pitch mit Sprecher
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 5. Customer */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
              5. Kundendetails
            </h2>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Kundenstadt
            </label>
            <input
              type="text"
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              placeholder="z.B. Wien, München..."
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedProductVersion || !selectedCategory || !selectedTemplate}
            className="w-full bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Generiere..." : "Präsentation generieren"}
          </button>
        </form>
      </div>
    </div>
  )
}
