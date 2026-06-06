"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface DashboardData {
  stats: {
    totalPresentations: number
    publishedPresentations: number
    draftPresentations: number
    totalProducts: number
    totalProductGroups: number
    totalTemplates: number
    totalUsers: number
  }
  recentPresentations: {
    id: string
    title: string
    customerCity: string
    status: string
    presentationType: string
    productName: string
    productGroupName: string
    categoryName: string
    updatedAt: string
    createdAt: string
  }[]
  presentationsPerGroup: { name: string; count: number; color: string }[]
  productGroups: { id: string; name: string; productCount: number; templateCount: number }[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then(setData)
        .finally(() => setIsLoading(false))
    }
  }, [status])

  if (status === "loading" || isLoading) return <LoadingScreen />

  const stats = data?.stats
  const maxGroupCount = Math.max(...(data?.presentationsPerGroup.map((g) => g.count) || [1]), 1)

  return (
    <div className="bg-[#F5F5F5] flex-1">
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">
            Guten Tag{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[#6B6B6B] mt-1">Hier ist dein Überblick über das ibox Portal.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard
            label="Präsentationen gesamt"
            value={stats?.totalPresentations ?? 0}
            sub={`${stats?.publishedPresentations ?? 0} veröffentlicht`}
            color="#309E3B"
            icon="📊"
          />
          <KPICard
            label="Entwürfe"
            value={stats?.draftPresentations ?? 0}
            sub="in Bearbeitung"
            color="#E8A020"
            icon="✏️"
          />
          <KPICard
            label="Produkte"
            value={stats?.totalProducts ?? 0}
            sub={`in ${stats?.totalProductGroups ?? 0} Produktgruppen`}
            color="#2563EB"
            icon="📦"
          />
          <KPICard
            label="Templates"
            value={stats?.totalTemplates ?? 0}
            sub="aktive Templates"
            color="#7C3AED"
            icon="🎨"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Recent Presentations */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E8E8E8]">
            <div className="px-6 py-5 border-b border-[#F0F0F0] flex justify-between items-center">
              <h2 className="font-semibold text-[#1A1A1A]">Zuletzt bearbeitet</h2>
              <Link href="/presentations" className="text-sm text-[#309E3B] hover:underline">
                Alle anzeigen →
              </Link>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
              {data?.recentPresentations.length === 0 ? (
                <div className="px-6 py-8 text-center text-[#9B9B9B] text-sm">
                  Noch keine Präsentationen vorhanden.
                </div>
              ) : (
                data?.recentPresentations.map((p) => (
                  <Link
                    key={p.id}
                    href={`/presentations/${p.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#F0F9F1] flex items-center justify-center text-[#309E3B] font-bold text-sm flex-shrink-0">
                      {p.productGroupName?.substring(0, 2).toUpperCase() || "IB"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] text-sm truncate group-hover:text-[#309E3B] transition">
                        {p.title}
                      </p>
                      <p className="text-xs text-[#9B9B9B] mt-0.5">
                        📍 {p.customerCity} · {p.categoryName} · {new Date(p.updatedAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={p.status} />
                      <span className="text-[10px] text-[#9B9B9B]">
                        {p.presentationType === "begleitet" ? "🎤" : "📄"}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">

            {/* Präsentationen nach Produktgruppe */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <h2 className="font-semibold text-[#1A1A1A] mb-4">Nach Produktgruppe</h2>
              {data?.presentationsPerGroup.length === 0 ? (
                <p className="text-sm text-[#9B9B9B]">Noch keine Daten</p>
              ) : (
                <div className="space-y-3">
                  {data?.presentationsPerGroup.map((g) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#1A1A1A] font-medium">{g.name}</span>
                        <span className="text-[#6B6B6B]">{g.count}</span>
                      </div>
                      <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(g.count / maxGroupCount) * 100}%`,
                            backgroundColor: g.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Produktgruppen */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <h2 className="font-semibold text-[#1A1A1A] mb-4">Produktgruppen</h2>
              <div className="space-y-2">
                {data?.productGroups.map((pg) => (
                  <div key={pg.id} className="flex items-center justify-between py-2 border-b border-[#F5F5F5] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{pg.name}</p>
                      <p className="text-xs text-[#9B9B9B]">{pg.productCount} Produkte · {pg.templateCount} Templates</p>
                    </div>
                    <Link
                      href={`/admin/templates?productGroupId=${pg.id}`}
                      className="text-xs text-[#309E3B] hover:underline"
                    >
                      Templates →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Schnellzugriff</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction href="/presentations/new" icon="➕" label="Neue Präsentation" color="#309E3B" />
            <QuickAction href="/admin/templates" icon="🎨" label="Templates verwalten" color="#7C3AED" />
            <QuickAction href="/admin/products" icon="📦" label="Produkte verwalten" color="#2563EB" />
            <QuickAction href="/admin/product-groups" icon="🗂" label="Produktgruppen" color="#E8A020" />
          </div>
        </div>

      </main>
    </div>
  )
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function KPICard({ label, value, sub, color, icon }: { label: string; value: number; sub: string; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#9B9B9B] font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
          <p className="text-xs text-[#9B9B9B] mt-1">{sub}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-3 h-0.5 rounded-full" style={{ backgroundColor: color, opacity: 0.3 }} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      status === "PUBLISHED"
        ? "bg-[#E8F5E9] text-[#309E3B]"
        : "bg-[#F5F5F5] text-[#9B9B9B]"
    }`}>
      {status === "PUBLISHED" ? "Live" : "Entwurf"}
    </span>
  )
}

function QuickAction({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-lg border border-[#E8E8E8] hover:border-[#D0D0D0] hover:shadow-sm transition group"
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#309E3B] transition">{label}</span>
    </Link>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#309E3B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#6B6B6B] text-sm">Portal wird geladen...</p>
      </div>
    </div>
  )
}
