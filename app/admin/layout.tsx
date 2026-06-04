'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) return <div className="text-center py-12">Wird geladen...</div>

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <nav className="w-64 bg-white border-r border-gray-200 p-6">
        <Link href="/admin" className="text-2xl font-bold text-ibox-green mb-8 block">
          ibox.city
        </Link>

        <div className="space-y-4">
          <Link
            href="/admin/product-groups"
            className="block px-4 py-2 rounded hover:bg-gray-100 text-sm font-medium"
          >
            Produktgruppen
          </Link>
          <Link
            href="/admin/products"
            className="block px-4 py-2 rounded hover:bg-gray-100 text-sm font-medium"
          >
            Produkte
          </Link>
          <Link
            href="/admin/categories"
            className="block px-4 py-2 rounded hover:bg-gray-100 text-sm font-medium"
          >
            Kategorien
          </Link>
          <Link
            href="/admin/designs"
            className="block px-4 py-2 rounded hover:bg-gray-100 text-sm font-medium"
          >
            Designs
          </Link>
          <Link
            href="/admin/templates"
            className="block px-4 py-2 rounded hover:bg-gray-100 text-sm font-medium"
          >
            Templates
          </Link>
          <Link
            href="/admin/offers"
            className="block px-4 py-2 rounded hover:bg-gray-100 text-sm font-medium"
          >
            Zusatzangebote
          </Link>
        </div>

        <div className="mt-12 pt-6 border-t">
          <button
            onClick={() => router.push("/")}
            className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
