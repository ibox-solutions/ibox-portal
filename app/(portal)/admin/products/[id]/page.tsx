'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Presentation {
  id: string
  title: string
  customerCity: string
  status: string
  presentationType: string
  updatedAt: string
  baseCategory?: { name: string }
}

interface ProductVersion {
  id: string
  version: string
  isActive: boolean
  description?: string
  presentations?: Presentation[]
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  productGroup: { id: string; name: string }
  versions: ProductVersion[]
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<string>('ALL')

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch(`/api/presentations`).then((r) => r.json()),
    ]).then(([productData, presData]) => {
      setProduct(productData)
      // Filter presentations for this product
      const versionIds = new Set(productData.versions?.map((v: ProductVersion) => v.id) || [])
      const filtered = presData.filter((p: any) => versionIds.has(p.baseProductVersionId))
      setPresentations(filtered)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-[#6B6B6B]">
      <div className="w-4 h-4 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin" />
      Laden...
    </div>
  )

  if (!product) return <div className="p-8 text-[#9B9B9B]">Produkt nicht gefunden.</div>

  const filteredPresentations = selectedVersion === 'ALL'
    ? presentations
    : presentations.filter((p: any) => p.baseProductVersionId === selectedVersion)

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-[#9B9B9B] mb-1">{product.productGroup.name}</p>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">{product.name}</h1>
          {product.description && <p className="text-[#6B6B6B] mt-2">{product.description}</p>}
          <div className="flex items-center gap-3 mt-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              product.isActive ? 'bg-[#E8F5E9] text-[#309E3B]' : 'bg-[#F5F5F5] text-[#9B9B9B]'
            }`}>
              {product.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
            <span className="text-xs text-[#9B9B9B]">{product.versions.length} Versionen</span>
            <span className="text-xs text-[#9B9B9B]">{presentations.length} Präsentationen</span>
          </div>
        </div>
        <Link
          href={`/presentations/new`}
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition flex items-center gap-2"
        >
          ⚡ Neue Präsentation
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Versions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
            <h2 className="font-semibold text-[#1A1A1A] mb-4">Versionen</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedVersion('ALL')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition flex items-center justify-between ${
                  selectedVersion === 'ALL' ? 'bg-[#F0F9F1] text-[#309E3B] font-medium' : 'text-[#6B6B6B] hover:bg-[#F5F5F5]'
                }`}
              >
                <span>Alle Versionen</span>
                <span className="text-xs bg-[#F5F5F5] px-2 py-0.5 rounded-full text-[#9B9B9B]">
                  {presentations.length}
                </span>
              </button>
              {product.versions.map((v) => {
                const count = presentations.filter((p: any) => p.baseProductVersionId === v.id).length
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersion(v.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition flex items-center justify-between ${
                      selectedVersion === v.id ? 'bg-[#F0F9F1] text-[#309E3B] font-medium' : 'text-[#6B6B6B] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <div>
                      <span>{v.version}</span>
                      {!v.isActive && <span className="ml-2 text-xs text-[#E8A020]">(Inaktiv)</span>}
                      {v.description && <p className="text-xs text-[#9B9B9B] mt-0.5">{v.description}</p>}
                    </div>
                    <span className="text-xs bg-[#F5F5F5] px-2 py-0.5 rounded-full text-[#9B9B9B]">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Presentations */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#E0E0E0]">
            <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
              <h2 className="font-semibold text-[#1A1A1A]">
                Präsentationen
                <span className="ml-2 text-sm font-normal text-[#9B9B9B]">({filteredPresentations.length})</span>
              </h2>
            </div>

            {filteredPresentations.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[#9B9B9B] text-sm mb-4">Noch keine Präsentationen für dieses Produkt.</p>
                <Link
                  href="/presentations/new"
                  className="text-[#309E3B] hover:underline text-sm"
                >
                  Erste Präsentation erstellen →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#F5F5F5]">
                {filteredPresentations.map((p) => (
                  <Link
                    key={p.id}
                    href={`/presentations/${p.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] text-sm group-hover:text-[#309E3B] transition truncate">
                        {p.title}
                      </p>
                      <p className="text-xs text-[#9B9B9B] mt-0.5">
                        📍 {p.customerCity}
                        {p.baseCategory?.name && <> · {p.baseCategory.name}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                      <span>{p.presentationType === 'begleitet' ? '🎤' : '📄'}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'PUBLISHED' ? 'bg-[#E8F5E9] text-[#309E3B]' : 'bg-[#F5F5F5] text-[#9B9B9B]'
                      }`}>
                        {p.status === 'PUBLISHED' ? 'Live' : 'Entwurf'}
                      </span>
                      <span className="text-[#9B9B9B] hidden md:block">
                        {new Date(p.updatedAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
