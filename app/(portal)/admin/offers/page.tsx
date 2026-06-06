'use client'

import { useEffect, useState } from 'react'

interface Offer {
  id: string
  name: string
  slug: string
  description?: string
  category: string
  price?: number
  isActive: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  Subscription: '🔄',
  Service: '🔧',
  Hardware: '🖥',
  Software: '💾',
  Content: '🎨',
  Sonstiges: '📦',
}

const CATEGORIES = ['Subscription', 'Service', 'Hardware', 'Software', 'Content', 'Sonstiges']

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Service')
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('ALL')

  useEffect(() => { fetchOffers() }, [])

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/offers')
      const data = await res.json()
      setOffers(data)
    } finally {
      setLoading(false)
    }
  }

  const createOffer = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
          category: newCategory,
          description: newDescription.trim() || undefined,
        }),
      })
      setNewName('')
      setNewDescription('')
      setShowNew(false)
      fetchOffers()
    } finally {
      setSaving(false)
    }
  }

  const filtered = offers.filter((o) => filterCategory === 'ALL' || o.category === filterCategory)

  const grouped: Record<string, Offer[]> = {}
  filtered.forEach((o) => {
    if (!grouped[o.category]) grouped[o.category] = []
    grouped[o.category].push(o)
  })

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
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Zusatzangebote</h1>
          <p className="text-[#6B6B6B] mt-1">Add-ons und Services für Präsentationen</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
        >
          + Neues Angebot
        </button>
      </div>

      {/* New Form */}
      {showNew && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Neues Zusatzangebot</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z.B. Content-Paket Basic, Wartungsvertrag, LED-Upgrade"
                className="flex-1 px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                autoFocus
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Kurze Beschreibung (optional)"
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
              onKeyDown={(e) => e.key === 'Enter' && createOffer()}
            />
            <div className="flex gap-2">
              <button onClick={createOffer} disabled={saving} className="px-5 py-2 bg-[#309E3B] text-white rounded-lg text-sm font-medium hover:bg-[#2a8a32] disabled:opacity-50">
                Erstellen
              </button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[#6B6B6B] text-sm hover:text-[#1A1A1A]">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilterCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterCategory === 'ALL' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E0E0E0] text-[#6B6B6B] hover:text-[#1A1A1A]'}`}
        >
          Alle ({offers.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = offers.filter((o) => o.category === cat).length
          if (count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterCategory === cat ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E0E0E0] text-[#6B6B6B] hover:text-[#1A1A1A]'}`}
            >
              {CATEGORY_ICONS[cat]} {cat} ({count})
            </button>
          )
        })}
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-12 text-center text-[#9B9B9B]">
          Noch keine Zusatzangebote vorhanden.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{CATEGORY_ICONS[cat] || '📦'}</span>
                <h2 className="font-semibold text-[#1A1A1A] text-sm">{cat}</h2>
                <span className="text-xs text-[#9B9B9B] bg-[#F5F5F5] px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
                {items.map((o, i) => (
                  <div key={o.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-[#F5F5F5]' : ''}`}>
                    <div>
                      <p className="font-medium text-[#1A1A1A] text-sm">{o.name}</p>
                      {o.description && <p className="text-xs text-[#9B9B9B] mt-0.5">{o.description}</p>}
                    </div>
                    <span className="text-xs text-[#9B9B9B]">{o.slug}</span>
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
