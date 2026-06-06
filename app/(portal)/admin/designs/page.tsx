'use client'

import { useEffect, useState } from 'react'

interface Design {
  id: string
  name: string
  slug: string
  description?: string
  isDefault: boolean
  productGroup?: { name: string }
  colors?: any
}

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchDesigns() }, [])

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/designs')
      const data = await res.json()
      setDesigns(data)
    } finally {
      setLoading(false)
    }
  }

  const createDesign = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/admin/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        }),
      })
      setNewName('')
      setShowNew(false)
      fetchDesigns()
    } finally {
      setSaving(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Designs</h1>
          <p className="text-[#6B6B6B] mt-1">Design-Varianten für Präsentationen</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
        >
          + Neues Design
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-[#F0F9F1] border border-[#309E3B]/20 rounded-xl p-4 mb-6 text-sm text-[#309E3B]">
        <strong>Hinweis:</strong> Designs steuern Farben, Typografie und Layout-Varianten. Das eigentliche HTML-Template wird unter <strong>Templates</strong> verwaltet.
      </div>

      {showNew && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-3">Neues Design</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="z.B. ibox Standard, Dark Premium, Clean White"
              className="flex-1 px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
              onKeyDown={(e) => e.key === 'Enter' && createDesign()}
              autoFocus
            />
            <button onClick={createDesign} disabled={saving} className="px-5 py-2 bg-[#309E3B] text-white rounded-lg text-sm font-medium hover:bg-[#2a8a32] disabled:opacity-50">
              Erstellen
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[#6B6B6B] text-sm">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {designs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-12 text-center text-[#9B9B9B]">
          Noch keine Designs vorhanden.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {designs.map((d) => (
            <div key={d.id} className="bg-white border border-[#E0E0E0] rounded-xl p-5 hover:shadow-sm transition">
              {/* Color Preview */}
              <div className="flex gap-1.5 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#309E3B]" title="ibox Grün" />
                <div className="w-6 h-6 rounded-full bg-[#1A1A1A]" title="Dunkel" />
                <div className="w-6 h-6 rounded-full bg-[#F5F5F5] border border-[#E0E0E0]" title="Hell" />
              </div>
              <h3 className="font-semibold text-[#1A1A1A]">{d.name}</h3>
              {d.description && <p className="text-xs text-[#9B9B9B] mt-1">{d.description}</p>}
              <div className="flex items-center gap-2 mt-3">
                {d.isDefault && (
                  <span className="text-xs px-2 py-0.5 bg-[#E8F5E9] text-[#309E3B] rounded-full font-medium">Standard</span>
                )}
                <span className="text-xs text-[#9B9B9B]">{d.slug}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
