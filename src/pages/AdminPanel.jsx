import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthContext } from '../context/AuthContext'
 
export default function AdminPanel() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()
 
  const [gebruikers, setGebruikers] = useState([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')
  const [zoek, setZoek] = useState('')
 
  useEffect(() => {
    async function laadGebruikers() {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const lijst = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setGebruikers(lijst)
      } catch {
        setFout('Kon gebruikers niet laden.')
      } finally {
        setLaden(false)
      }
    }
    laadGebruikers()
  }, [])
 
  async function handleRolWijzigen(uid, nieuweRol) {
    try {
      await updateDoc(doc(db, 'users', uid), { role: nieuweRol })
      setGebruikers((prev) =>
        prev.map((g) => (g.id === uid ? { ...g, role: nieuweRol } : g))
      )
    } catch {
      setFout('Rol wijzigen mislukt.')
    }
  }
 
  async function handleLogout() {
    await logout()
    navigate('/login')
  }
 
  const gefilterd = gebruikers.filter(
    (g) =>
      g.naam?.toLowerCase().includes(zoek.toLowerCase()) ||
      g.email?.toLowerCase().includes(zoek.toLowerCase())
  )
 
  const aantalDeelnemers = gebruikers.filter((g) => g.role === 'deelnemer').length
  const aantalAdmins = gebruikers.filter((g) => g.role === 'admin').length
  const aantalMetTeam = gebruikers.filter((g) => g.teamId).length
 
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
 
      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span>
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
          <span className="text-[#84cc16] text-xs border border-[#84cc16]/30 rounded px-2 py-0.5 tracking-widest uppercase">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5"
          >
            Uitloggen
          </button>
        </div>
      </header>
 
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
 
        {/* Header */}
        <div>
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">beheer</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Admin panel
          </h1>
          <p className="text-white/30 text-sm mt-2">
            Ingelogd als <span className="text-white/50">{user?.naam}</span>
          </p>
        </div>
 
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Deelnemers', value: laden ? '…' : aantalDeelnemers },
            { label: 'Admins', value: laden ? '…' : aantalAdmins },
            { label: 'In een team', value: laden ? '…' : aantalMetTeam },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-white/30 text-xs uppercase tracking-widest">{label}</span>
              <span className="text-white text-3xl font-black leading-none">{value}</span>
            </div>
          ))}
        </div>
 
        {/* Gebruikerslijst */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4">
            <h2 className="text-white font-bold">Gebruikers</h2>
            <input
              type="text"
              placeholder="Zoek op naam of e-mail…"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              className="bg-white/5 border border-white/10 focus:border-[#84cc16]/40 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 outline-none transition-colors w-64"
            />
          </div>
 
          {fout && (
            <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
              {fout}
            </div>
          )}
 
          {laden ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-white/10 border-t-[#84cc16] rounded-full animate-spin" />
            </div>
          ) : gefilterd.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-12">Geen gebruikers gevonden.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {gefilterd.map((g) => (
                <div key={g.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{g.naam || '—'}</p>
                    <p className="text-white/30 text-xs truncate">{g.email}</p>
                    {g.teamId && (
                      <p className="text-white/20 text-xs mt-0.5">Team: {g.teamId}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Rol badge */}
                    <span className={`text-xs px-2 py-1 rounded border ${
                      g.role === 'admin'
                        ? 'text-[#84cc16] border-[#84cc16]/30 bg-[#84cc16]/5'
                        : 'text-white/40 border-white/10'
                    }`}>
                      {g.role || 'deelnemer'}
                    </span>
                    {/* Rol toggle — niet op zichzelf */}
                    {g.id !== user?.uid && (
                      <button
                        onClick={() =>
                          handleRolWijzigen(g.id, g.role === 'admin' ? 'deelnemer' : 'admin')
                        }
                        className="text-xs text-white/30 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {g.role === 'admin' ? 'Maak deelnemer' : 'Maak admin'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
 
      </main>
    </div>
  )
}