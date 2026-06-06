'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  path: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newCatName) return
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCatName,
        slug: newCatName.toLowerCase().replace(/\s+/g, '-'),
        path: newCatName.charAt(0).toUpperCase(),
      }),
    })
    setNewCatName('')
    fetch('/api/admin/categories').then((r) => r.json()).then(setCategories)
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Kategorien</h1>
      <p className="text-gray-600 mb-8">Verwalte Branche-Kategorien</p>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex gap-4">
          <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="z.B. Gastronomie" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" onKeyPress={(e) => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} className="px-6 py-2 bg-green-600 text-white rounded-lg">Erstellen</button>
        </div>
      </div>

      {loading ? <div className="text-center py-12">Wird geladen...</div> : categories.length === 0 ? <div className="bg-gray-50 rounded-lg p-8 text-center">Noch keine Kategorien</div> : <div className="grid gap-4">{categories.map((cat) => (<div key={cat.id} className="bg-white rounded-lg border border-gray-200 p-6"><h3 className="font-semibold">{cat.name}</h3><p className="text-sm text-gray-500">{cat.path}</p></div>))}</div>}
    </div>
  )
}
