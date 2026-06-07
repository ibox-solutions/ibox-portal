"use client"

import { useEffect, useState } from "react"

interface Country { id: string; code: string; name: string; flag: string }
interface Team { id: string; name: string; countryId: string; country: Country }
interface User {
  id: string; name: string; email: string; role: string
  isActive: boolean; lastLogin: string | null; createdAt: string
  country: Country | null; team: Team | null; presentationCount: number
}

const ROLES = ["ADMIN", "MITARBEITER"]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MITARBEITER", countryId: "", teamId: "" })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [u, c, t] = await Promise.all([
      fetch("/api/admin/users").then(r => r.json()),
      fetch("/api/admin/countries").then(r => r.json()),
      fetch("/api/admin/teams").then(r => r.json()),
    ])
    setUsers(u); setCountries(c); setTeams(t)
    setLoading(false)
  }

  const filteredTeams = form.countryId ? teams.filter(t => t.countryId === form.countryId) : teams

  const resetForm = () => setForm({ name: "", email: "", password: "", role: "MITARBEITER", countryId: "", teamId: "" })

  const openEdit = (u: User) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: "", role: u.role, countryId: u.country?.id || "", teamId: u.team?.id || "" })
    setShowNew(true)
  }

  const save = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      if (editUser) {
        await fetch(`/api/admin/users/${editUser.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, countryId: form.countryId || null, teamId: form.teamId || null }),
        })
      } else {
        if (!form.password) { alert("Passwort erforderlich"); setSaving(false); return }
        await fetch("/api/admin/users", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, countryId: form.countryId || null, teamId: form.teamId || null }),
        })
      }
      resetForm(); setShowNew(false); setEditUser(null); fetchAll()
    } finally { setSaving(false) }
  }

  const toggleActive = async (u: User) => {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    })
    fetchAll()
  }

  const deleteUser = async (u: User) => {
    if (!confirm(`User "${u.name}" wirklich löschen?`)) return
    await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" })
    fetchAll()
  }

  if (loading) return <div className="p-8 flex items-center gap-2 text-[#6B6B6B]"><div className="w-4 h-4 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin"/>Laden...</div>

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Benutzerverwaltung</h1>
          <p className="text-[#6B6B6B] mt-1">{users.length} Benutzer · {users.filter(u=>u.isActive).length} aktiv</p>
        </div>
        <button onClick={() => { resetForm(); setEditUser(null); setShowNew(true) }}
          className="bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium px-5 py-2.5 rounded-lg text-sm transition">
          + Neuer Benutzer
        </button>
      </div>

      {/* Form */}
      {showNew && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-5">{editUser ? `${editUser.name} bearbeiten` : "Neuer Benutzer"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Name *</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]" placeholder="Max Mustermann"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Email *</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]" placeholder="max@ibox.eu.com"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5 uppercase tracking-wide">{editUser ? "Neues Passwort (leer = unverändert)" : "Passwort *"}</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]" placeholder="••••••••"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Rolle</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white">
                {ROLES.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Land</label>
              <select value={form.countryId} onChange={e=>setForm({...form,countryId:e.target.value,teamId:""})}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white">
                <option value="">-- Kein Land --</option>
                {countries.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Team</label>
              <select value={form.teamId} onChange={e=>setForm({...form,teamId:e.target.value})}
                disabled={!form.countryId}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-white disabled:opacity-50">
                <option value="">-- Kein Team --</option>
                {filteredTeams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={save} disabled={saving}
              className="px-5 py-2 bg-[#309E3B] text-white rounded-lg text-sm font-medium hover:bg-[#2a8a32] disabled:opacity-50">
              {saving ? "Speichert..." : editUser ? "Speichern" : "Erstellen"}
            </button>
            <button onClick={()=>{setShowNew(false);setEditUser(null);resetForm()}}
              className="px-4 py-2 text-[#6B6B6B] text-sm hover:text-[#1A1A1A]">Abbrechen</button>
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0F0F0]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Benutzer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Land / Team</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Rolle</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Präsentationen</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Letzter Login</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={`${i>0?"border-t border-[#F5F5F5]":""} hover:bg-[#FAFAFA] transition`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F0F9F1] flex items-center justify-center text-[#309E3B] font-bold text-sm flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A] text-sm">{u.name}</p>
                      <p className="text-xs text-[#9B9B9B]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm text-[#1A1A1A]">
                    {u.country ? <span>{u.country.flag} {u.country.name}</span> : <span className="text-[#9B9B9B]">—</span>}
                  </div>
                  {u.team && <div className="text-xs text-[#9B9B9B] mt-0.5">{u.team.name}</div>}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    u.role === "ADMIN" ? "bg-[#FFF3E0] text-[#E8A020]" : "bg-[#F5F5F5] text-[#6B6B6B]"
                  }`}>{u.role}</span>
                </td>
                <td className="px-5 py-4 text-sm text-[#1A1A1A] font-medium">{u.presentationCount}</td>
                <td className="px-5 py-4 text-xs text-[#9B9B9B]">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("de-DE") : "Nie"}
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleActive(u)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                      u.isActive ? "bg-[#E8F5E9] text-[#309E3B] hover:bg-red-50 hover:text-red-600" : "bg-[#F5F5F5] text-[#9B9B9B] hover:bg-[#E8F5E9] hover:text-[#309E3B]"
                    }`}>
                    {u.isActive ? "Aktiv" : "Inaktiv"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)}
                      className="text-xs px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-[#6B6B6B] hover:text-[#309E3B] hover:border-[#309E3B] transition">
                      Bearbeiten
                    </button>
                    <button onClick={() => deleteUser(u)}
                      className="text-xs px-3 py-1.5 text-[#9B9B9B] hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-12 text-center text-[#9B9B9B] text-sm">Noch keine Benutzer vorhanden.</div>
        )}
      </div>
    </div>
  )
}
