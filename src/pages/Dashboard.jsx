import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthContext } from '../context/AuthContext'

// -------------------- Hooks / Helpers --------------------

async function laadTeamNaam(teamId) {
  if (!teamId) return null
  const snap = await getDoc(doc(db, 'teams', teamId))
  return snap.exists() ? snap.data().naam ?? null : null
}

async function laadStappenVandaag(uid) {
  // placeholder: hier zou je stappen ophalen uit Firestore
  return 5000
}

async function slaStappenOp(uid, aantal) {
  // placeholder: hier zou je stappen opslaan in Firestore
  return true
}

async function verwerkBadges(uid, stepsMap) {
  // placeholder: hier check je voor nieuwe badges
  return ['badge1'] // teruggeven array met nieuwe badge id's
}

function dagVanApril() {
  // placeholder: huidige dag van april
  const today = new Date()
  return today.getDate()
}

// -------------------- Placeholder Components --------------------
function StappenGrafiek({ uid, refresh }) {
  return <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">Grafiek hier</div>
}

function Klassement() {
  return <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">Klassement hier</div>
}

// -------------------- Hoofdcomponent --------------------
export default function DashboardEnBadges() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  // ---- State ----
  const [teamNaam, setTeamNaam] = useState(null)
  const [stappenVandaag, setStappenVandaag] = useState(null)
  const [stappenInput, setStappenInput] = useState('')
  const [stappenLaden, setStappenLaden] = useState(false)
  const [stappenFout, setStappenFout] = useState('')
  const [stappenOpgeslagen, setStappenOpgeslagen] = useState(false)
  const [initLaden, setInitLaden] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [nieuwVerdiend, setNieuwVerdiend] = useState(null)

  const ALLE_BADGES = [
    { id: 'badge1', naam: 'Eerste stappen', icoon: '🏅', beschrijving: 'Je eerste stappen!' },
    { id: 'badge2', naam: '10k stappen', icoon: '🎯', beschrijving: '10.000 stappen bereikt!' },
  ]
  const verdiendeBadges = { badge1: { verdiendOp: new Date() } } // voorbeeld

  // ---- Initialisatie ----
  useEffect(() => {
    if (!user) return
    async function init() {
      const [naam, stappen] = await Promise.all([
        laadTeamNaam(user.teamId),
        laadStappenVandaag(user.uid),
      ])
      setTeamNaam(naam)
      if (stappen !== null) {
        setStappenVandaag(stappen)
        setStappenInput(String(stappen))
      }
      setInitLaden(false)
    }
    init()
  }, [user])

  // ---- Nieuw badge animatie trigger ----
  useEffect(() => {
    const nieuw = localStorage.getItem('nieuw_badge')
    if (nieuw) {
      setNieuwVerdiend(nieuw)
      localStorage.removeItem('nieuw_badge')
      setTimeout(() => setNieuwVerdiend(null), 3000)
    }
  }, [])

  // ---- Functies ----
  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleStappenOpslaan(e) {
    e.preventDefault()
    const aantal = parseInt(stappenInput, 10)
    if (!stappenInput || isNaN(aantal) || aantal < 0) {
      setStappenFout('Vul een geldig aantal stappen in.')
      return
    }
    if (aantal > 100000) {
      setStappenFout('Max 100.000 stappen.')
      return
    }
    setStappenLaden(true)
    setStappenFout('')
    try {
      await slaStappenOp(user.uid, aantal)
      setStappenVandaag(aantal)
      setStappenOpgeslagen(true)
      setRefreshTrigger(t => t + 1)

      const vandaag = new Date().toISOString().split('T')[0]
      const stepsMap = { [vandaag]: aantal }
      const nieuweBadges = await verwerkBadges(user.uid, stepsMap)
      if (nieuweBadges.length > 0) {
        localStorage.setItem('nieuw_badge', nieuweBadges[0])
      }

      setTimeout(() => setStappenOpgeslagen(false), 3000)
    } catch (err) {
      setStappenFout('Opslaan mislukt. Probeer het opnieuw.')
    } finally {
      setStappenLaden(false)
    }
  }

  const dag = dagVanApril()
  const voortgang = Math.min((stappenVandaag ?? 0) / 10000, 1)
  const initials = (user?.naam || user?.email || 'U').slice(0, 2).toUpperCase()
  const maandNaam = new Date().toLocaleString('nl-NL', { month: 'long', year: 'numeric' })

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span>
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5"
          >
            Uitloggen
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        {/* Welkom */}
        <div>
          <h1 className="text-4xl font-black tracking-tight leading-tight">
            {user?.naam || 'Deelnemer'}
          </h1>
          <p className="text-white/30 text-sm mt-2">
            Rol: <span className="text-white/50 capitalize">{user?.role || 'deelnemer'}</span>
            {user?.teamId ? ` · Team: ${initLaden ? '…' : (teamNaam ?? user.teamId)}` : ''}
          </p>
        </div>

        {/* Stappen invoer */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-lg">Stappen vandaag</h2>
          <form onSubmit={handleStappenOpslaan} className="flex gap-3">
            <input
              type="number"
              min="0"
              max="100000"
              value={stappenInput}
              onChange={(e) => { setStappenInput(e.target.value); setStappenFout('') }}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm"
            />
            <button
              type="submit"
              disabled={stappenLaden}
              className="bg-[#84cc16] disabled:opacity-50 rounded-lg px-5 py-3"
            >
              {stappenLaden ? 'Opslaan...' : 'Opslaan'}
            </button>
          </form>
          {stappenFout && <div className="text-red-400 text-sm">{stappenFout}</div>}
          {stappenOpgeslagen && <div className="text-[#84cc16] text-sm">✓ Stappen opgeslagen!</div>}
        </div>

        {/* Badges overzicht */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALLE_BADGES.map((badge) => {
            const isVerdiend = !!verdiendeBadges[badge.id]
            const isNieuw = nieuwVerdiend === badge.id
            return (
              <div key={badge.id} className={`p-5 border rounded-2xl ${isVerdiend ? 'bg-[#84cc16]/10' : 'bg-white/[0.02] opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{badge.icoon}</div>
                  <div>
                    <h3>{badge.naam} {isNieuw && '🌟'}</h3>
                    <p className="text-xs">{badge.beschrijving}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Grafiek & Klassement */}
        <StappenGrafiek uid={user?.uid} refresh={refreshTrigger} />
        <Klassement />

      </main>
    </div>
  )
}