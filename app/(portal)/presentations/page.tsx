"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function PresentationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [presentations, setPresentations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        const res = await fetch("/api/presentations")
        if (res.ok) {
          const data = await res.json()
          setPresentations(data)
        }
      } catch (error) {
        console.error("Error fetching presentations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchPresentations()
    }
  }, [status])

  if (status === "loading") {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Präsentationen</h1>
            <p className="text-[#6B6B6B] mt-1">Verwalte deine ibox Präsentationen</p>
          </div>
          <Link
            href="/presentations/new"
            className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-6 py-3 rounded-lg transition"
          >
            + Neue Präsentation
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-[#6B6B6B]">Laden...</p>
          </div>
        ) : presentations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              Noch keine Präsentationen
            </h2>
            <p className="text-[#6B6B6B] mb-6">
              Erstelle deine erste ibox Präsentation!
            </p>
            <Link
              href="/presentations/new"
              className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-6 py-3 rounded-lg transition inline-block"
            >
              Präsentation erstellen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((presentation: any) => (
              <div
                key={presentation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    presentation.status === "PUBLISHED"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {presentation.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
                  </span>
                  <span className="text-xs text-[#6B6B6B]">
                    {presentation.presentationType === "begleitet" ? "🎤 Begleitet" : "📄 Unbegleitet"}
                  </span>
                </div>

                {/* Title & City */}
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                  {presentation.title}
                </h3>
                <p className="text-sm text-[#6B6B6B] mb-4">
                  📍 {presentation.customerCity}
                </p>

                {/* Date */}
                <p className="text-xs text-[#9B9B9B] mb-4 mt-auto">
                  Erstellt am {new Date(presentation.createdAt).toLocaleDateString("de-DE")}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/presentations/${presentation.id}`}
                    className="flex-1 text-center bg-[#309E3B] hover:bg-[#2a8a32] text-white text-sm font-medium py-2 rounded transition"
                  >
                    Anzeigen
                  </Link>
                  <a
                    href={`/api/presentations/${presentation.id}/download`}
                    className="flex-1 text-center bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#1A1A1A] text-sm font-medium py-2 rounded transition"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
