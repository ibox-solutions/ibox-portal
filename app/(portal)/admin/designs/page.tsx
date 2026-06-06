'use client'

import { useEffect, useState } from 'react'

interface Design {
  id: string
  name: string
  slug: string
}

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [newDesignName, setNewDesignName] = useState('')

  useEffect(() => {
    fetch('/api/admin/designs').then((r) => r.json()).then(setDesigns).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newDesignName) return
    await fetch('/api/admin/designs', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newDesignName, slug: newDesignName.toLowerCase().replace(/\s+/g, '-')})})
    setNewDesignName('')
    fetch('/api/admin/designs').then((r) => r.json()).then(setDesigns)
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Designs</h1>
      <p className="text-gray-600 mb-8">Verwalte Design-Vorlagen</p>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex gap-4">
          <input type="text" value={newDesignName} onChange={(e) => setNewDesignName(e.target.value)} placeholder="z.B. Gastronomie Standard" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" onKeyPress={(e) => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} className="px-6 py-2 bg-green-600 text-white rounded-lg">Erstellen</button>
        </div>
      </div>
      {loading ? <div className="text-center py-12">Wird geladen...</div> : designs.length === 0 ? <div className="bg-gray-50 rounded-lg p-8 text-center">Noch keine Designs</div> : <div className="grid gap-4">{designs.map((d) => (<div key={d.id} className="bg-white rounded-lg border border-gray-200 p-6"><h3 className="font-semibold">{d.name}</h3></div>))}</div>}
    </div>
  )
}
