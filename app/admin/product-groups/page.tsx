'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ProductGroup {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  _count?: { products: number }
}

export default function ProductGroupsPage() {
  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/product-groups')
      const data = await res.json()
      setGroups(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newGroupName) return

    try {
      const res = await fetch('/api/admin/product-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          slug: newGroupName.toLowerCase().replace(/\s+/g, '-'),
        }),
      })

      if (res.ok) {
        setNewGroupName('')
        fetchGroups()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return

    try {
      await fetch(`/api/admin/product-groups/${id}`, {
        method: 'DELETE',
      })
      fetchGroups()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Produktgruppen</h1>
        <p className="text-gray-600">Verwalte alle Produktgruppen</p>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Neue Produktgruppe</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="z.B. ibox, iboard, SaaS"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Erstellen
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Wird geladen...</div>
      ) : groups.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          Noch keine Produktgruppen
        </div>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <p className="text-sm text-gray-500">
                    {group._count?.products || 0} Produkte
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/product-groups/${group.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
