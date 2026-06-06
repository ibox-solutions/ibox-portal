'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  path: string
  parentCategoryId?: string
  childCategories?: Category[]
  _count?: { presentations: number }
}

const CATEGORY_ICONS: Record<string, string> = {
  'Einzelhandel': '🛒', 'Gastronomie': '🍽', 'Hotel': '🏨', 'Apotheke': '💊',
  'Bahnhof': '🚂', 'Flughafen': '✈️', 'Gemeinde': '🏛', 'Stadt': '🏙',
  'Gesundheit': '🏥', 'Sport': '⚽', 'Bildung': '🎓', 'Büro': '🏢',
  'Immobilien': '🏗', 'Bank': '🏦', 'Tankstelle': '⛽', 'Supermarkt': '🛍',
}

function getCategoryIcon(name: string) {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '🏷'
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [newCatPath, setNewCatPath] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async () => {
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          path: newCatPath.trim() || newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
        }),
      })
      setNewCatName('')
      setNewCatPath('')
      setShowNew(false)
      fetchCategories()
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Branche "${name}" wirklich löschen?`)) return
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    fetchCategories()
  }

  const filtered = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-[#6B6B6B]">
      <div className="w-4 h-4 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin" />
      Laden...
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Branchen</h1>
          <p className="text-[#6B6B6B] mt-1">{categories.length} Branchen definiert</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
        >
          + Neue Branche
        </button>
      </div>

      {/* New Form */}
      {showNew && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Neue Branche</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="z.B. Einzelhandel, Gastronomie, Bahnhöfe"
              className="flex-1 px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
              onKeyDown={(e) => e.key === 'Enter' && createCategory()}
              autoFocus
            />
            <button onClick={createCategory} disabled={saving} className="px-5 py-2 bg-[#309E3B] text-white rounded-lg text-sm font-medium hover:bg-[#2a8a32] disabled:opacity-50">
              Erstellen
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[#6B6B6B] text-sm hover:text-[#1A1A1A]">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Branche suchen..."
          className="w-full max-w-sm px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-12 text-center text-[#9B9B9B]">
          Keine Branchen gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(cat.name)}</span>
                <div>
                  <p className="font-medium text-[#1A1A1A] text-sm">{cat.name}</p>
                  <p className="text-xs text-[#9B9B9B]">{cat.path}</p>
                </div>
              </div>
              <button
                onClick={() => deleteCategory(cat.id, cat.name)}
                className="text-xs text-[#9B9B9B] hover:text-red-600 opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
