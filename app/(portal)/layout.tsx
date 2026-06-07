"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

const NAV = [
  {
    label: "Hauptmenü",
    items: [
      { href: "/dashboard", icon: "⊞", label: "Dashboard" },
      { href: "/presentations", icon: "📊", label: "Präsentationen" },
      { href: "/presentations/new", icon: "➕", label: "Neue Präsentation", highlight: true },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      { href: "/admin/templates", icon: "🎨", label: "Templates" },
      { href: "/admin/product-groups", icon: "🗂", label: "Produktgruppen" },
      { href: "/admin/products", icon: "📦", label: "Produkte" },
      { href: "/admin/categories", icon: "🏷", label: "Branchen" },
      { href: "/admin/designs", icon: "✏️", label: "Designs" },
      { href: "/admin/offers", icon: "➕", label: "Zusatzangebote" },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/admin/users", icon: "👥", label: "Benutzer" },
      { href: "/admin/countries", icon: "🌍", label: "Länder & Teams" },
    ],
  },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex bg-[#F5F5F5]">

      {/* Sidebar */}
      <aside className="w-60 bg-[#1A1A1A] flex flex-col fixed top-0 left-0 h-screen z-40">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#2a2a2a]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#309E3B] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">ix</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight">ibox Portal</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/dashboard" && item.href !== "/presentations/new" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        item.highlight
                          ? "bg-[#309E3B] text-white hover:bg-[#2a8a32]"
                          : isActive
                          ? "bg-[#2a2a2a] text-white"
                          : "text-[#888] hover:text-white hover:bg-[#242424]"
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#309E3B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[#555] text-[10px] truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#666] hover:text-white hover:bg-[#242424] transition"
          >
            <span>⎋</span>
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <div className="ml-60 flex-1 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
