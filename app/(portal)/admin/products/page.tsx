'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ProductVersion {
  id: string
  version: string
  isActive: boolean
  _count?: { presentations: number }
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  versions: ProductVersion[]
  productGroup: { id: string; name: string }
  _count?: { versions: number }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Produkt "${name}" wirklich löschen?`)) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const filtered = products.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.productGroup?.name.toLowerCase().includes(search.toLowerCase())
  )

  // Group by productGroup
  const grouped: Record<string, Product[]> = {}
  filtered.forEach((p) => {
    const key = p.productGroup?.name || 'Sonstige'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(p)
  })

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-[#6B6B6B]">
      <div className="w-4 h-4 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin" />
      Laden...
    </div>
  )

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Produkte</h1>
          <p className="text-[#6B6B6B] mt-1">{products.length} Produkte in {Object.keys(grouped).length} Gruppen</p>
        </div>
        <Link
          href="/admin/product-groups"
          className="text-sm text-[#309E3B] hover:underline"
        >
          → In Produktgruppen verwalten
        </Link>
      </div>

      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Produkt oder Gruppe suchen..."
          className="w-full max-w-sm px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
        />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-12 text-center text-[#9B9B9B]">
          Keine Produkte gefunden.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupName, groupProducts]) => (
            <div key={groupName}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#F0F9F1] flex items-center justify-center text-[#309E3B] font-bold text-xs">
                  {groupName.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="font-semibold text-[#1A1A1A] text-sm">{groupName}</h2>
                <span className="text-xs text-[#9B9B9B] bg-[#F5F5F5] px-2 py-0.5 rounded-full">{groupProducts.length}</span>
              </div>

              <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
                {groupProducts.map((product, i) => (
                  <div key={product.id} className={i > 0 ? 'border-t border-[#F5F5F5]' : ''}>
                    {/* Product Row */}
                    <div className="flex items-center justify-between px-5 py-4">
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [product.id]: !p[product.id] }))}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <span className="text-[#309E3B] text-xs w-3">
                          {expanded[product.id] ? '▼' : '▶'}
                        </span>
                        <div>
                          <p className="font-medium text-[#1A1A1A] text-sm">{product.name}</p>
                          <p className="text-xs text-[#9B9B9B] mt-0.5">
                            {product.versions.length} Version{product.versions.length !== 1 ? 'en' : ''}
                            {product.description && <> · {product.description}</>}
                          </p>
                        </div>
                        {!product.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-[#FFF3E0] text-[#E8A020] rounded-full">Inaktiv</span>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-xs px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-[#6B6B6B] hover:text-[#309E3B] hover:border-[#309E3B] transition"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id, product.name)}
                          className="text-xs px-3 py-1.5 text-[#9B9B9B] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Versions */}
                    {expanded[product.id] && (
                      <div className="px-5 pb-4 border-t border-[#F5F5F5] pt-3 bg-[#FAFAFA]">
                        <p className="text-xs font-medium text-[#6B6B6B] mb-2 uppercase tracking-wide">Versionen</p>
                        {product.versions.length === 0 ? (
                          <p className="text-xs text-[#9B9B9B]">Keine Versionen vorhanden.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {product.versions.map((v) => (
                              <span
                                key={v.id}
                                className={`text-xs px-3 py-1 rounded-full border ${
                                  v.isActive
                                    ? 'border-[#309E3B] text-[#309E3B] bg-[#F0F9F1]'
                                    : 'border-[#E0E0E0] text-[#9B9B9B]'
                                }`}
                              >
                                {v.version}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
