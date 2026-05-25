'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  productGroup?: { name: string }
}

interface ProductGroup {
  id: string
  name: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductName, setNewProductName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/admin/products').then((r) => r.json()), fetch('/api/admin/product-groups').then((r) => r.json())]).then(([p, g]) => {setProducts(p); setGroups(g); setLoading(false)})
  }, [])

  const handleCreate = async () => {
    if (!newProductName || !selectedGroupId) return
    await fetch('/api/admin/products', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newProductName, slug: newProductName.toLowerCase().replace(/\s+/g, '-'), productGroupId: selectedGroupId})})
    setNewProductName('')
    setSelectedGroupId('')
    fetch('/api/admin/products').then((r) => r.json()).then(setProducts)
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Produkte</h1>
      <p className="text-gray-600 mb-8">Verwalte alle Produkte</p>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex gap-4">
          <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg"><option value="">Produktgruppe wählen</option>{groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select>
          <input type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder='z.B. 4K Display 65"' className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" onKeyPress={(e) => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} className="px-6 py-2 bg-green-600 text-white rounded-lg">Erstellen</button>
        </div>
      </div>
      {loading ? <div className="text-center py-12">Wird geladen...</div> : products.length === 0 ? <div className="bg-gray-50 rounded-lg p-8 text-center">Noch keine Produkte</div> : <div className="grid gap-4">{products.map((p) => (<div key={p.id} className="bg-white rounded-lg border border-gray-200 p-6"><h3 className="font-semibold">{p.name}</h3><p className="text-sm text-gray-500">{p.productGroup?.name}</p></div>))}</div>}
    </div>
  )
}
