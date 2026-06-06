"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [productGroups, setProductGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [filterProductGroup, setFilterProductGroup] = useState("")
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<any>(null)
  const [newName, setNewName] = useState("")
  const [newProductGroupId, setNewProductGroupId] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const fetchData = async () => {
    try {
      const [tRes, pgRes] = await Promise.all([
        fetch("/api/admin/templates"),
        fetch("/api/admin/product-groups"),
      ])
      if (tRes.ok) setTemplates(await tRes.json())
      if (pgRes.ok) setProductGroups(await pgRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTemplates = templates.filter((t) => {
    if (filterProductGroup && t.productGroupId !== filterProductGroup) return false
    return true
  })

  const openCreateModal = (source?: any) => {
    setDuplicateSource(source || null)
    setNewName(source ? `${source.name} (Kopie)` : "")
    setNewProductGroupId(source?.productGroupId || "")
    setNewDescription("")
    setCreateError("")
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    if (!newProductGroupId || !newName) {
      setCreateError("Bitte Name und Produktgruppe angeben")
      return
    }
    setIsCreating(true)
    setCreateError("")

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          productGroupId: newProductGroupId,
          duplicateFromId: duplicateSource?.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setCreateError(err.error || "Fehler beim Erstellen")
        setIsCreating(false)
        return
      }

      const template = await res.json()
      router.push(`/admin/templates/${template.id}`)
    } catch (e) {
      setCreateError("Netzwerkfehler")
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string, name: string, isStandard: boolean) => {
    if (isStandard) {
      alert("Standard-Templates können nicht gelöscht werden.")
      return
    }
    if (!confirm(`Template "${name}" wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" })
      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== id))
      } else {
        const err = await res.json()
        alert(err.error || "Fehler beim Löschen")
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (isLoading) {
    return <div className="p-8">Laden...</div>
  }

  // Group templates by product group for display
  const groupedTemplates = filteredTemplates.reduce((acc: any, t) => {
    const key = t.productGroupId
    if (!acc[key]) acc[key] = { productGroup: t.productGroup, templates: [] }
    acc[key].templates.push(t)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Templates</h1>
            <p className="text-[#6B6B6B] mt-1">
              HTML-Vorlagen für Präsentationen verwalten
            </p>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-6 py-3 rounded-lg transition"
          >
            + Custom Template
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#6B6B6B]">Produktgruppe:</label>
            <select
              value={filterProductGroup}
              onChange={(e) => setFilterProductGroup(e.target.value)}
              className="px-3 py-1.5 border border-[#E0E0E0] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
            >
              <option value="">Alle</option>
              {productGroups.map((pg) => (
                <option key={pg.id} value={pg.id}>{pg.name}</option>
              ))}
            </select>
          </div>
          {filterProductGroup && (
            <button
              onClick={() => setFilterProductGroup("")}
              className="text-sm text-[#309E3B] hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
          <span className="text-sm text-[#6B6B6B] ml-auto">
            {filteredTemplates.length} von {templates.length}
          </span>
        </div>

        {/* Templates grouped by ProductGroup */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B6B6B] mb-4">Keine Templates gefunden</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(groupedTemplates).map((group: any) => (
              <div key={group.productGroup.id}>
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                  📦 {group.productGroup.name}
                  <span className="text-sm font-normal text-[#6B6B6B]">
                    ({group.templates.length})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.templates.map((template: any) => (
                    <div
                      key={template.id}
                      className={`bg-white rounded-lg shadow hover:shadow-lg transition p-5 flex flex-col ${
                        template.isStandard ? "border-2 border-[#309E3B]" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                          {template.isStandard && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#309E3B] text-white">
                              ⭐ Standard
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            template.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {template.isActive ? "Aktiv" : "Inaktiv"}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">
                        {template.name}
                      </h3>

                      {template.description && (
                        <p className="text-sm text-[#6B6B6B] mb-3">{template.description}</p>
                      )}

                      <p className="text-xs text-[#9B9B9B] mb-3 mt-auto">
                        Aktualisiert {new Date(template.updatedAt).toLocaleDateString("de-DE")}
                      </p>

                      <div className="flex gap-2">
                        <Link
                          href={`/admin/templates/${template.id}`}
                          className="flex-1 text-center bg-[#309E3B] hover:bg-[#2a8a32] text-white text-sm font-medium py-2 rounded transition"
                        >
                          Bearbeiten
                        </Link>
                        <button
                          onClick={() => openCreateModal(template)}
                          className="px-3 text-center bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#1A1A1A] text-sm font-medium py-2 rounded transition"
                          title="Als Custom duplizieren"
                        >
                          📋
                        </button>
                        {!template.isStandard && (
                          <button
                            onClick={() => handleDelete(template.id, template.name, template.isStandard)}
                            className="px-3 text-center bg-[#F5F5F5] hover:bg-red-100 hover:text-red-700 text-[#1A1A1A] text-sm font-medium py-2 rounded transition"
                            title="Löschen"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
              {duplicateSource ? "Template duplizieren" : "Custom Template anlegen"}
            </h2>
            {duplicateSource && (
              <p className="text-sm text-[#6B6B6B] mb-4">
                Wird von <strong>{duplicateSource.name}</strong> kopiert
              </p>
            )}
            {!duplicateSource && (
              <p className="text-sm text-[#6B6B6B] mb-4">
                Das neue Template wird zunächst vom Standard der gewählten Produktgruppe kopiert.
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Sommer-Aktion, Premium-Variante"
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Produktgruppe *
                </label>
                <select
                  value={newProductGroupId}
                  onChange={(e) => setNewProductGroupId(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                >
                  <option value="">-- Wählen --</option>
                  {productGroups.map((pg) => (
                    <option key={pg.id} value={pg.id}>{pg.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Beschreibung (optional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Wofür ist dieses Template gedacht?"
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                />
              </div>

              {createError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {createError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-[#E0E0E0] rounded-lg text-[#1A1A1A] hover:bg-[#F5F5F5] transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-[#309E3B] hover:bg-[#2a8a32] text-white rounded-lg transition disabled:opacity-50"
              >
                {isCreating ? "Erstelle..." : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
