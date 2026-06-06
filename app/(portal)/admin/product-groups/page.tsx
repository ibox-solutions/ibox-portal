'use client'

import { useEffect, useState } from 'react'

interface ProductVersion {
  id: string
  version: string
  isActive: boolean
  description?: string
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  versions: ProductVersion[]
}

interface ProductGroup {
  id: string
  name: string
  slug: string
  description?: string
  products: Product[]
}

export default function ProductGroupsPage() {
  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})

  // New group form
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)

  // New product form
  const [newProductName, setNewProductName] = useState<Record<string, string>>({})
  const [showNewProduct, setShowNewProduct] = useState<Record<string, boolean>>({})

  // New version form
  const [newVersionName, setNewVersionName] = useState<Record<string, string>>({})
  const [showNewVersion, setShowNewVersion] = useState<Record<string, boolean>>({})

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/product-groups')
      const data = await res.json()
      setGroups(data)
      // Auto-expand all groups
      const exp: Record<string, boolean> = {}
      data.forEach((g: ProductGroup) => { exp[g.id] = true })
      setExpanded(exp)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/product-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          slug: newGroupName.trim().toLowerCase().replace(/\s+/g, '-'),
        }),
      })
      if (res.ok) {
        setNewGroupName('')
        setShowNewGroup(false)
        fetchGroups()
      }
    } finally {
      setSaving(false)
    }
  }

  const createProduct = async (groupId: string) => {
    const name = newProductName[groupId]?.trim()
    if (!name) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          productGroupId: groupId,
        }),
      })
      if (res.ok) {
        setNewProductName((prev) => ({ ...prev, [groupId]: '' }))
        setShowNewProduct((prev) => ({ ...prev, [groupId]: false }))
        fetchGroups()
      }
    } finally {
      setSaving(false)
    }
  }

  const createVersion = async (productId: string) => {
    const version = newVersionName[productId]?.trim()
    if (!version) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/product-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, version }),
      })
      if (res.ok) {
        setNewVersionName((prev) => ({ ...prev, [productId]: '' }))
        setShowNewVersion((prev) => ({ ...prev, [productId]: false }))
        fetchGroups()
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`Produktgruppe "${name}" wirklich löschen? Alle Produkte werden ebenfalls gelöscht.`)) return
    await fetch(`/api/admin/product-groups/${id}`, { method: 'DELETE' })
    fetchGroups()
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Produkt "${name}" wirklich löschen?`)) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    fetchGroups()
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-[#6B6B6B]">
      <div className="w-4 h-4 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin" />
      Laden...
    </div>
  )

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Produktgruppen</h1>
          <p className="text-[#6B6B6B] mt-1">Produktgruppen → Produkte → Versionen</p>
        </div>
        <button
          onClick={() => setShowNewGroup(!showNewGroup)}
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2.5 rounded-lg transition text-sm"
        >
          + Neue Gruppe
        </button>
      </div>

      {/* New Group Form */}
      {showNewGroup && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-3">Neue Produktgruppe</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="z.B. ibox.city, iboard, ibox.system"
              className="flex-1 px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B] text-sm"
              onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              autoFocus
            />
            <button onClick={createGroup} disabled={saving} className="px-5 py-2 bg-[#309E3B] text-white rounded-lg text-sm font-medium hover:bg-[#2a8a32] disabled:opacity-50">
              Erstellen
            </button>
            <button onClick={() => setShowNewGroup(false)} className="px-4 py-2 text-[#6B6B6B] hover:text-[#1A1A1A] text-sm">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-12 text-center text-[#9B9B9B]">
          Noch keine Produktgruppen vorhanden.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">

              {/* Group Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#F0F9F1] flex items-center justify-center text-[#309E3B] font-bold text-sm">
                    {group.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-[#1A1A1A]">{group.name}</h2>
                    <p className="text-xs text-[#9B9B9B]">{group.products.length} Produkte</p>
                  </div>
                  <span className="text-[#9B9B9B] ml-2 text-xs">
                    {expanded[group.id] ? '▲' : '▼'}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowNewProduct((p) => ({ ...p, [group.id]: true }))
                      setExpanded((p) => ({ ...p, [group.id]: true }))
                    }}
                    className="text-xs px-3 py-1.5 bg-[#F0F9F1] text-[#309E3B] rounded-lg hover:bg-[#E0F5E1] font-medium transition"
                  >
                    + Produkt
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id, group.name)}
                    className="text-xs px-3 py-1.5 text-[#9B9B9B] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Löschen
                  </button>
                </div>
              </div>

              {/* Expanded: Products */}
              {expanded[group.id] && (
                <div className="px-6 py-4 space-y-3">

                  {/* New Product Form */}
                  {showNewProduct[group.id] && (
                    <div className="flex gap-2 p-3 bg-[#F5F5F5] rounded-lg">
                      <input
                        type="text"
                        value={newProductName[group.id] || ''}
                        onChange={(e) => setNewProductName((p) => ({ ...p, [group.id]: e.target.value }))}
                        placeholder='z.B. ibox.city Standard, iboard 65"'
                        className="flex-1 px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && createProduct(group.id)}
                        autoFocus
                      />
                      <button onClick={() => createProduct(group.id)} disabled={saving} className="px-4 py-1.5 bg-[#309E3B] text-white rounded-lg text-sm hover:bg-[#2a8a32] disabled:opacity-50">
                        Hinzufügen
                      </button>
                      <button onClick={() => setShowNewProduct((p) => ({ ...p, [group.id]: false }))} className="px-3 py-1.5 text-[#6B6B6B] text-sm hover:text-[#1A1A1A]">
                        ✕
                      </button>
                    </div>
                  )}

                  {group.products.length === 0 && !showNewProduct[group.id] ? (
                    <p className="text-sm text-[#9B9B9B] py-2">
                      Noch keine Produkte.{' '}
                      <button
                        onClick={() => setShowNewProduct((p) => ({ ...p, [group.id]: true }))}
                        className="text-[#309E3B] hover:underline"
                      >
                        Erstes Produkt hinzufügen →
                      </button>
                    </p>
                  ) : (
                    group.products.map((product) => (
                      <div key={product.id} className="border border-[#F0F0F0] rounded-lg overflow-hidden">

                        {/* Product Row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-[#FAFAFA]">
                          <button
                            onClick={() => setExpandedProducts((p) => ({ ...p, [product.id]: !p[product.id] }))}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <span className="text-[#309E3B] text-xs">
                              {expandedProducts[product.id] ? '▼' : '▶'}
                            </span>
                            <span className="font-medium text-[#1A1A1A] text-sm">{product.name}</span>
                            <span className="text-xs text-[#9B9B9B] ml-1">
                              {product.versions.length} Version{product.versions.length !== 1 ? 'en' : ''}
                            </span>
                            {!product.isActive && (
                              <span className="text-xs px-2 py-0.5 bg-[#FFF3E0] text-[#E8A020] rounded-full">Inaktiv</span>
                            )}
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowNewVersion((p) => ({ ...p, [product.id]: true }))
                                setExpandedProducts((p) => ({ ...p, [product.id]: true }))
                              }}
                              className="text-xs px-2.5 py-1 bg-white border border-[#E0E0E0] text-[#6B6B6B] rounded hover:text-[#309E3B] hover:border-[#309E3B] transition"
                            >
                              + Version
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id, product.name)}
                              className="text-xs px-2.5 py-1 text-[#9B9B9B] hover:text-red-600 hover:bg-red-50 rounded transition"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Versions */}
                        {expandedProducts[product.id] && (
                          <div className="px-4 py-3 space-y-2 border-t border-[#F0F0F0]">

                            {/* New Version Form */}
                            {showNewVersion[product.id] && (
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  value={newVersionName[product.id] || ''}
                                  onChange={(e) => setNewVersionName((p) => ({ ...p, [product.id]: e.target.value }))}
                                  placeholder="z.B. v1.0, 2024, Standard"
                                  className="flex-1 px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                                  onKeyDown={(e) => e.key === 'Enter' && createVersion(product.id)}
                                  autoFocus
                                />
                                <button onClick={() => createVersion(product.id)} disabled={saving} className="px-3 py-1.5 bg-[#309E3B] text-white rounded-lg text-xs hover:bg-[#2a8a32] disabled:opacity-50">
                                  OK
                                </button>
                                <button onClick={() => setShowNewVersion((p) => ({ ...p, [product.id]: false }))} className="px-2 text-[#9B9B9B] text-xs hover:text-[#1A1A1A]">
                                  ✕
                                </button>
                              </div>
                            )}

                            {product.versions.length === 0 ? (
                              <p className="text-xs text-[#9B9B9B]">Keine Versionen. Klick "+ Version" um eine hinzuzufügen.</p>
                            ) : (
                              product.versions.map((v) => (
                                <div key={v.id} className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                                  <span className="w-2 h-2 rounded-full bg-[#309E3B] flex-shrink-0" />
                                  <span className="font-medium text-[#1A1A1A]">{v.version}</span>
                                  {v.description && <span className="text-[#9B9B9B]">— {v.description}</span>}
                                  {!v.isActive && <span className="text-[#E8A020]">(Inaktiv)</span>}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
