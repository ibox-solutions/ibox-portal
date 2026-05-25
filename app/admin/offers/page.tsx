'use client'

import { useEffect, useState } from 'react'

interface Offer {
  id: string
  name: string
  slug: string
  category: string
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [newOfferName, setNewOfferName] = useState('')
  const [category, setCategory] = useState('Subscription')

  useEffect(() => {
    fetch('/api/admin/offers').then((r) => r.json()).then(setOffers).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newOfferName) return
    await fetch('/api/admin/offers', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newOfferName, slug: newOfferName.toLowerCase().replace(/\s+/g, '-'), category})})
    setNewOfferName('')
    fetch('/api/admin/offers').then((r) => r.json()).then(setOffers)
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Zusatzangebote</h1>
      <p className="text-gray-600 mb-8">Verwalte Add-ons</p>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex gap-4">
          <input type="text" value={newOfferName} onChange={(e) => setNewOfferName(e.target.value)} placeholder="z.B. Müllsackabo" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" onKeyPress={(e) => e.key === 'Enter' && handleCreate()} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg"><option>Subscription</option><option>Service</option></select>
          <button onClick={handleCreate} className="px-6 py-2 bg-green-600 text-white rounded-lg">Erstellen</button>
        </div>
      </div>
      {loading ? <div className="text-center py-12">Wird geladen...</div> : offers.length === 0 ? <div className="bg-gray-50 rounded-lg p-8 text-center">Noch keine Angebote</div> : <div className="grid gap-4">{offers.map((o) => (<div key={o.id} className="bg-white rounded-lg border border-gray-200 p-6"><h3 className="font-semibold">{o.name}</h3><p className="text-sm text-gray-500">{o.category}</p></div>))}</div>}
    </div>
  )
}
