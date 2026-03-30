import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthContext } from '../context/AuthContext'
import { useStepStats } from '../hooks/useStepStats'

function dagVanApril() {
  const nu = new Date()
  const start = new Date(nu.getFullYear(), 3, 1)
  const diff = Math.floor((nu - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.min(Math.max(diff, 1), 30)
}

function vandaagISO() {
  return new Date().toISOString().split('T')[0]
}

async function laadTeamNaam(teamId) {
  if (!teamId) return null
  const snap = await getDoc(doc(db, 'teams', teamId))
  return snap.exists() ? (snap.data().naam ?? null) : null
}

async function laadStappenVandaag(uid) {
  const id = `${uid}_${vandaagISO()}`
  const snap = await getDoc(doc(db, 'stappen', id))
  return snap.exists() ? snap.data().stappen : null
}

async function slaStappenOp(uid, stappen) {
  const id = `${uid}_${vandaagISO()}`
  await setDoc(doc(db, 'stappen', id), {
    uid,
    datum: vandaagISO(),
    stappen: Number(stappen),
  })
}

function formatSteps(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return n.toString()
}

export default function Dashboard() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()
  const { stats } = useStepStats(user?.uid)

  const [teamNaam, setTeamNaam] = useState(null)
  const [stappenVandaag, setStappenVandaag] = useState(null)
  const [stappenInput, setStappenInput] = useState('')
  const [stappenLaden, setStappenLaden] = useState(false)
  const [stappenFout, setStappenFout] = useState('')
  const [stappenOpgeslagen, setStappenOpgeslagen] = useState(false)
  const [initLaden, setInitLaden] = useState(true)

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
      setStappenFout('Dat lijkt ons wat veel. Max 100.000 stappen.')
      return
    }
    setStappenLaden(true)
    setStappenFout('')
    try {
      await slaStappenOp(user.uid, aantal)
      setStappenVandaag(aantal)
      setStappenOpgeslagen(true)
      setTimeout(() => setStappenOpgeslagen(false), 3000)
    } catch {
      setStappenFout('Opslaan mislukt. Probeer het opnieuw.')
    } finally {
      setStappenLaden(false)
    }
  }

  const dag = dagVanApril()
  const voortgang = Math.min((stappenVandaag ?? 0) / 10000, 1)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span>
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block">{user?.email}</span>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="text-xs uppercase tracking-widest text-[#84cc16]/60 hover:text-[#84cc16] transition-colors border border-[#84cc16]/20 hover:border-[#84cc16]/40 rounded-lg px-3 py-1.5"
            >
              Admin
            </button>
          )}
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
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">welkom terug</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            {user?.displayName || user?.naam || 'Deelnemer'}
          </h1>
          <p className="text-white/30 text-sm mt-2">
            Rol: <span className="text-white/50 capitalize">{user?.role || 'deelnemer'}</span>
            {user?.teamId
              ? <> · Team: <span className="text-white/50">{initLaden ? '…' : (teamNaam ?? user.teamId)}</span></>
              : <> · <span className="text-white/30">Geen team gekoppeld</span></>
            }
          </p>
        </div>

        {/* S2-03 — Statistieken: totaal, doeldagen, streak */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Totaal stappen', value: formatSteps(stats.totalSteps) },
            { label: 'Dagen doel gehaald', value: stats.goalDays, highlight: true },
            { label: 'Streak', value: `🔥 ${stats.streak}` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-white/30 text-xs uppercase tracking-widest">{label}</span>
              <span className={`text-3xl font-black leading-none ${highlight ? 'text-[#84cc16]' : 'text-white'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Dag stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Dag', value: dag, suffix: '/ 30' },
            { label: 'Vandaag', value: initLaden ? '…' : (stappenVandaag !== null ? stappenVandaag.toLocaleString('nl-NL') : '—'), suffix: 'stappen' },
            { label: 'Doel', value: '10.000', suffix: 'stappen' },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-white/30 text-xs uppercase tracking-widest">{label}</span>
              <span className="text-white text-3xl font-black leading-none">{value}</span>
              <span className="text-white/20 text-xs">{suffix}</span>
            </div>
          ))}
        </div>

        {/* Stappen invoer */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Stappen vandaag</h2>
              <p className="text-white/30 text-sm">
                {stappenVandaag !== null
                  ? 'Je hebt vandaag al stappen ingevoerd. Je kunt ze aanpassen.'
                  : 'Voer je stappen in voor vandaag'}
              </p>
            </div>
            <span className="text-2xl">👟</span>
          </div>

          <form onSubmit={handleStappenOpslaan} noValidate className="flex gap-3">
            <input
              type="number"
              min="0"
              max="100000"
              placeholder="bijv. 8450"
              value={stappenInput}
              onChange={(e) => { setStappenInput(e.target.value); setStappenFout('') }}
              className="flex-1 bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={stappenLaden}
              className="bg-[#84cc16] hover:bg-[#95d926] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-bold text-sm rounded-lg px-5 py-3 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {stappenLaden && (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
              )}
              {stappenLaden ? 'Opslaan...' : 'Opslaan'}
            </button>
          </form>

          {stappenFout && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {stappenFout}
            </div>
          )}
          {stappenOpgeslagen && (
            <div className="bg-[#84cc16]/10 border border-[#84cc16]/20 rounded-lg px-4 py-3 text-[#84cc16] text-sm">
              ✓ Stappen opgeslagen!
            </div>
          )}

          {stappenVandaag !== null && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-white/30">
                <span>{stappenVandaag.toLocaleString('nl-NL')} stappen</span>
                <span>{Math.round(voortgang * 100)}% van dagdoel</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div
                  className="bg-[#84cc16] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${voortgang * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Challenge voortgang */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">Challenge voortgang</h2>
            <span className="text-white/30 text-xs uppercase tracking-widest">april 2025</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-[#84cc16] h-2 rounded-full transition-all"
              style={{ width: `${(dag / 30) * 100}%` }}
            />
          </div>
          <p className="text-white/30 text-xs">
            Dag {dag} van 30 · {30 - dag} dagen resterend
          </p>
        </div>

        {/* Team */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">Team</h2>
            <p className="text-white/30 text-sm mt-0.5">
              {initLaden
                ? '…'
                : user?.teamId
                  ? `Je zit in ${teamNaam ?? user.teamId}`
                  : 'Je bent nog niet in een team'}
            </p>
          </div>
          <button
            onClick={() => navigate('/team')}
            className="text-xs uppercase tracking-widest border border-white/10 hover:border-[#84cc16]/40 text-white/50 hover:text-white rounded-lg px-4 py-2 transition-colors"
          >
            {user?.teamId ? 'Bekijken' : 'Aansluiten'}
          </button>
        </div>

        {/* Profiel knop */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/profiel')}
            className="text-xs uppercase tracking-widest border border-white/10 hover:border-[#84cc16]/40 text-white/50 hover:text-white rounded-lg px-4 py-2 transition-colors"
          >
            Profiel
          </button>
        </div>

      </main>
    </div>
  )
}