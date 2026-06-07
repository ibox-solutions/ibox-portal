"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Presentation {
  id: string
  title: string
  customerCity: string
  status: string
  presentationType: string
  updatedAt: string
  createdAt: string
  baseProductVersion?: { product?: { name: string; productGroup?: { name: string } } }
  baseCategory?: { name: string }
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PUBLISHED: { label: "Live", class: "bg-[#E8F5E9] text-[#309E3B]" },
  DRAFT: { label: "Entwurf", class: "bg-[#F5F5F5] text-[#9B9B9B]" },
}

export default function PresentationsPage() {
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterType, setFilterType] = useState("ALL")
  const [groupBy, setGroupBy] = useState<"product" | "category" | "none">("product")

  useEffect(() => {
    fetch("/api/presentations")
      .then((r) => r.json())
      .then(setPresentations)
      .finally(() => setIsLoading(false))
  }, [])

  const deletePresentation = async (id: string, title: string) => {
    if (!confirm(`"${title}" wirklich löschen?`)) return
    await fetch(`/api/presentations/${id}`, { method: "DELETE" })
    setPresentations(prev => prev.filter(p => p.id !== id))
  }

  const filtered = presentations.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.customerCity.toLowerCase().includes(q) ||
      p.baseProductVersion?.product?.name?.toLowerCase().includes(q) ||
      p.baseCategory?.name?.toLowerCase().includes(q)
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus
    const matchesType = filterType === "ALL" || p.presentationType === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  // Group presentations
  const grouped: Record<string, Presentation[]> = {}
  filtered.forEach((p) => {
    let key = "Sonstige"
    if (groupBy === "product") key = p.baseProductVersion?.product?.productGroup?.name || "Sonstige"
    else if (groupBy === "category") key = p.baseCategory?.name || "Sonstige"
    else key = "Alle"
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(p)
  })

  return (
    <div className="p-8 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Präsentationen</h1>
          <p className="text-[#6B6B6B] mt-1">{presentations.length} Präsentationen gesamt</p>
        </div>
        <Link
          href="/presentations/new"
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2.5 rounded-lg transition text-sm flex items-center gap-2"
        >
          ⚡ Neue Präsentation
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen nach Titel, Stadt, Produkt..."
          className="flex-1 min-w-48 px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
        >
          <option value="ALL">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="PUBLISHED">Veröffentlicht</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
        >
          <option value="ALL">Alle Typen</option>
          <option value="begleitet">Begleitet</option>
          <option value="unbegleitet">Unbegleitet</option>
        </select>
        <div className="flex items-center gap-1 border border-[#E0E0E0] rounded-lg p-1">
          {([["product", "Produkt"], ["category", "Branche"], ["none", "Liste"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setGroupBy(val)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                groupBy === val ? "bg-[#309E3B] text-white" : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[#6B6B6B] py-12">
          <div className="w-4 h-4 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin" />
          Laden...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-12 text-center">
          <p className="text-[#9B9B9B] mb-4">Keine Präsentationen gefunden.</p>
          <Link href="/presentations/new" className="text-[#309E3B] hover:underline text-sm">
            Erste Präsentation erstellen →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName}>
              {groupBy !== "none" && (
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">{groupName}</h2>
                  <span className="text-xs text-[#9B9B9B] bg-[#F5F5F5] px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
              )}
              <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
                {items.map((p, i) => (
                  <div key={p.id} className="relative group">
                  <Link
                    key={p.id}
                    href={`/presentations/${p.id}`}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition group ${
                      i > 0 ? "border-t border-[#F5F5F5]" : ""
                    }`}
                  >
                    {/* Product Group Badge */}
                    <div className="w-10 h-10 rounded-lg bg-[#F0F9F1] flex items-center justify-center text-[#309E3B] font-bold text-xs flex-shrink-0">
                      {(p.baseProductVersion?.product?.productGroup?.name || "?").substring(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] text-sm group-hover:text-[#309E3B] transition truncate">
                        {p.title}
                      </p>
                      <p className="text-xs text-[#9B9B9B] mt-0.5">
                        📍 {p.customerCity}
                        {p.baseProductVersion?.product?.name && (
                          <> · {p.baseProductVersion.product.name}</>
                        )}
                        {p.baseCategory?.name && (
                          <> · {p.baseCategory.name}</>
                        )}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-[#9B9B9B]">
                      <span>{p.presentationType === "begleitet" ? "🎤" : "📄"}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[p.status]?.class || "bg-[#F5F5F5] text-[#9B9B9B]"}`}>
                        {STATUS_LABELS[p.status]?.label || p.status}
                      </span>
                      <span className="hidden md:block">
                        {new Date(p.updatedAt).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); deletePresentation(p.id, p.title) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition w-7 h-7 flex items-center justify-center text-[#9B9B9B] hover:text-red-500 hover:bg-red-50 rounded"
                    title="Löschen"
                  >✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
