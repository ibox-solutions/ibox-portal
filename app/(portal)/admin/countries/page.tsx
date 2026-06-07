"use client"

import { useEffect, useState } from "react"

interface Team { id: string; name: string; description?: string; countryId: string; _count: { users: number; presentations: number } }
interface Country {
  id: string; code: string; name: string; language: string; flag: string; isActive: boolean
  teams: Team[]; _count: { users: number; presentations: number }
}

const LANGUAGES = [{ value: "de", label: "Deutsch" }, { value: "en", label: "Englisch" }, { value: "fr", label: "Französisch" }]
const FLAGS: Record<string, string> = { AT: "🇦🇹", DE: "🇩🇪", CH: "🇨🇭", PL: "🇵🇱", IT: "🇮🇹", FR: "🇫🇷", NL: "🇳🇱", GB: "🇬🇧" }

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  // New country form
  const [showNewCountry, setShowNewCountry] = useState(false)
  const [newCountry, setNewCountry] = useState({ code: "", name: "", language: "de" })

  // New team forms
  const [showNewTeam, setShowNewTeam] = useState<Record<string, boolean>>({})
  const [newTeam, setNewTeam] = useState<Record<string, string>>({})

  useEffect(() => { fetchCountries() }, [])

  const fetchCountries = async () => {
    setLoading(true)
    const data = await fetch("/api/admin/countries").then(r => r.json())
    setCountries(data)
    const exp: Record<string, boolean> = {}
    data.forEach((c: Country) => { exp[c.id] = true })
    setExpanded(exp)
    setLoading(false)
  }

  const createCountry = async () => {
    if (!newCountry.code || !newCountry.name) return
    setSaving(true)
    await fetch("/api/admin/countries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newCountry, flag: FLAGS[newCountry.code.toUpperCase()] || "🏳️" }),
    })
    setNewCountry({ code: "", name: "", language: "de" })
    setShowNewCountry(false)
    fetchCountries()
    setSaving(false)
  }

  const createTeam = async (countryId: string) => {
    const name = newTeam[countryId]?.trim()
    if (!name) return
    setSaving(true)
    await fetch("/api/admin/teams", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, countryId }),
    })
    setNewTeam(p => ({ ...p, [countryId]: "" }))
    setShowNewTeam(p => ({ ...p, [countryId]: false }))
    fetchCountries()
    setSaving(false)
  }

  const deleteCountry = async (id: string, name: string) => {
    if (!confirm(`Land "${name}" und alle Teams löschen?`)) return
    await fetch(`/api/admin/countries/${id}`, { method: "DELETE" })
    fetchCountries()
  }

  const deleteTeam = async (id: string, name: string) => {
    if (!confirm(`Team "${name}" löschen?`)) return
    await fetch(`/api/admin/teams/${id}`, { method: "DELETE" })
    fetchCountries()
  }

  if (loading) return <div className="p-8 flex items-center gap-2 text-[#6B6B6B]"><div className="w-4 h-4 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin"/>Laden...</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Länder & Teams</h1>
          <p className="text-[#6B6B6B] mt-1">Organisationsstruktur für Zugriffssteuerung</p>
        </div>
        <button onClick={() => setShowNewCountry(!showNewCountry)}
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition">
          + Neues Land
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-[#F0F9F1] border border-[#309E3B]/20 rounded-xl p-4 mb-6 text-sm text-[#309E3B]">
        <strong>Zugriffslogik:</strong> Admin sieht alles · Mitarbeiter sehen nur Präsentationen ihres Teams
      </div>

      {/* New Country Form */}
      {showNewCountry && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Neues Land</h3>
          <div className="flex gap-3">
            <input value={newCountry.code} onChange={e=>setNewCountry({...newCountry,code:e.target.value.toUpperCase()})}
              placeholder="Code (AT, DE, CH...)" maxLength={3}
              className="w-28 px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] uppercase"/>
            <input value={newCountry.name} onChange={e=>setNewCountry({...newCountry,name:e.target.value})}
              placeholder="Name (z.B. Österreich)"
              className="flex-1 px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"/>
            <select value={newCountry.language} onChange={e=>setNewCountry({...newCountry,language:e.target.value})}
              className="w-36 px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white">
              {LANGUAGES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button onClick={createCountry} disabled={saving}
              className="px-5 py-2 bg-[#309E3B] text-white rounded-lg text-sm font-medium hover:bg-[#2a8a32] disabled:opacity-50">
              Erstellen
            </button>
            <button onClick={()=>setShowNewCountry(false)} className="px-3 py-2 text-[#6B6B6B] text-sm">✕</button>
          </div>
        </div>
      )}

      {/* Countries */}
      <div className="space-y-4">
        {countries.map(country => (
          <div key={country.id} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">

            {/* Country Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
              <button onClick={()=>setExpanded(p=>({...p,[country.id]:!p[country.id]}))}
                className="flex items-center gap-3 flex-1 text-left">
                <span className="text-2xl">{country.flag}</span>
                <div>
                  <h2 className="font-bold text-[#1A1A1A]">{country.name}</h2>
                  <p className="text-xs text-[#9B9B9B]">
                    {country.code} · {LANGUAGES.find(l=>l.value===country.language)?.label} · {country._count.users} User · {country._count.presentations} Präsentationen
                  </p>
                </div>
                <span className="text-[#9B9B9B] text-xs ml-2">{expanded[country.id] ? "▲" : "▼"}</span>
              </button>
              <div className="flex gap-2">
                <button onClick={()=>{setShowNewTeam(p=>({...p,[country.id]:true}));setExpanded(p=>({...p,[country.id]:true}))}}
                  className="text-xs px-3 py-1.5 bg-[#F0F9F1] text-[#309E3B] rounded-lg hover:bg-[#E0F5E1] font-medium transition">
                  + Team
                </button>
                <button onClick={()=>deleteCountry(country.id, country.name)}
                  className="text-xs px-3 py-1.5 text-[#9B9B9B] hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  Löschen
                </button>
              </div>
            </div>

            {/* Teams */}
            {expanded[country.id] && (
              <div className="px-6 py-4 space-y-2">
                {showNewTeam[country.id] && (
                  <div className="flex gap-2 p-3 bg-[#F5F5F5] rounded-lg mb-3">
                    <input value={newTeam[country.id] || ""} onChange={e=>setNewTeam(p=>({...p,[country.id]:e.target.value}))}
                      placeholder="Team-Name (z.B. Vertrieb Nord, Vertrieb Süd...)"
                      className="flex-1 px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white"
                      onKeyDown={e=>e.key==="Enter"&&createTeam(country.id)} autoFocus/>
                    <button onClick={()=>createTeam(country.id)} disabled={saving}
                      className="px-4 py-1.5 bg-[#309E3B] text-white rounded-lg text-sm hover:bg-[#2a8a32] disabled:opacity-50">
                      OK
                    </button>
                    <button onClick={()=>setShowNewTeam(p=>({...p,[country.id]:false}))} className="px-2 text-[#9B9B9B] text-sm">✕</button>
                  </div>
                )}

                {country.teams.length === 0 && !showNewTeam[country.id] ? (
                  <p className="text-sm text-[#9B9B9B] py-2">
                    Noch keine Teams.{" "}
                    <button onClick={()=>setShowNewTeam(p=>({...p,[country.id]:true}))} className="text-[#309E3B] hover:underline">
                      Erstes Team hinzufügen →
                    </button>
                  </p>
                ) : (
                  country.teams.map(team => (
                    <div key={team.id} className="flex items-center justify-between p-3 border border-[#F0F0F0] rounded-lg hover:bg-[#FAFAFA] transition">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-xs text-[#6B6B6B] font-bold">T</div>
                        <div>
                          <p className="font-medium text-[#1A1A1A] text-sm">{team.name}</p>
                          <p className="text-xs text-[#9B9B9B]">{team._count.users} User · {team._count.presentations} Präsentationen</p>
                        </div>
                      </div>
                      <button onClick={()=>deleteTeam(team.id, team.name)}
                        className="text-xs text-[#9B9B9B] hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition">
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
