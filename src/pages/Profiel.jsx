/**
 * Profielpagina voor gebruikersstatistieken en badges.
 * @returns {JSX.Element}
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useBadges, ALLE_BADGES } from '../hooks/useBadges'
import { useStats } from '../hooks/useStepStats'
 
const BADGE_DEF = ALLE_BADGES.map(b => ({
  id: b.id,
  icon: b.icoon,
  name: b.naam,
  desc: b.beschrijving,
}))
 
const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1_000_000]
const DEFAULT_DAGDOEL = 10000
 
// ── Helper functies voor mijlpalen ─────────────────────────────
function getNextMilestone(steps) {
  return MILESTONES.find(m => m > steps) ?? MILESTONES.at(-1)
}

function getPrevMilestone(steps) {
  const idx = MILESTONES.findIndex(m => m > steps)
  return idx <= 0 ? 0 : MILESTONES[idx - 1]
}

function fmt(n) {
  return n?.toLocaleString('nl-NL') ?? '0'
}

function calculateMilestoneProgress(steps) {
  const next = getNextMilestone(steps)
  const prev = getPrevMilestone(steps)
  if (next === prev) return steps >= next ? 100 : 0
  return Math.min(100, Math.max(0, Math.round(((steps - prev) / (next - prev)) * 100)))
}
 
// ── Modals ─────────────────────────────────────────────────────
function BewerkModal({ huidigeNaam, onOpslaan, onSluiten, laden }) {
  const [naam, setNaam] = useState(huidigeNaam)
  const [fout, setFout] = useState('')
 
  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = naam.trim()
    if (!trimmed) { setFout('Naam mag niet leeg zijn.'); return }
    if (trimmed.length < 2) { setFout('Naam moet minstens 2 tekens zijn.'); return }
    setFout('')
    await onOpslaan(trimmed)
  }
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSluiten} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg">Profiel bewerken</h3>
          <button onClick={onSluiten} className="text-white/30 hover:text-white transition-colors text-xl leading-none">x</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs uppercase tracking-widest">Gebruikersnaam</label>
            <input
              type="text"
              value={naam}
              onChange={e => { setNaam(e.target.value); setFout('') }}
              className="w-full bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
              placeholder="Jouw naam"
              autoFocus
            />
            {fout && <p className="text-red-400 text-xs">{fout}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onSluiten} className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all">
              Annuleren
            </button>
            <button type="submit" disabled={laden} className="flex-1 py-2.5 bg-[#84cc16] hover:bg-[#95d926] disabled:opacity-50 text-[#0a0a0a] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
              {laden && <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />}
              {laden ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
 
function VerwijderModal({ onBevestigen, onSluiten, laden }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
 
  async function handleSubmit(e) {
    e.preventDefault()
    if (!wachtwoord) { setFout('Vul je wachtwoord in.'); return }
    setFout('')
    try {
      await onBevestigen(wachtwoord)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setFout('Wachtwoord is onjuist.')
      } else {
        setFout('Er ging iets mis. Probeer het opnieuw.')
      }
    }
  }
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onSluiten} />
      <div className="relative w-full max-w-sm bg-[#111] border border-red-500/20 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg">Account verwijderen</h3>
          <button onClick={onSluiten} className="text-white/30 hover:text-white transition-colors text-xl leading-none">x</button>
        </div>
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 space-y-1">
          <p className="text-red-400 text-sm font-semibold">Dit kan niet ongedaan gemaakt worden</p>
          <p className="text-white/40 text-xs">Je stappen, badges en teamlidmaatschap worden permanent verwijderd.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs uppercase tracking-widest">Bevestig met wachtwoord</label>
            <input
              type="password"
              value={wachtwoord}
              onChange={e => { setWachtwoord(e.target.value); setFout('') }}
              className="w-full bg-white/5 border border-white/10 focus:border-red-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
              placeholder="Jouw wachtwoord"
              autoFocus
            />
            {fout && <p className="text-red-400 text-xs">{fout}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onSluiten} className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all">
              Annuleren
            </button>
            <button type="submit" disabled={laden} className="flex-1 py-2.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
              {laden && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />}
              {laden ? 'Verwijderen...' : 'Verwijderen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
 
function BadgeRow({ badge, unlocked }) {
  return (
    <div className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${unlocked ? 'bg-[#84cc16]/[0.04] border-[#84cc16]/25' : 'bg-white/[0.02] border-white/[0.07] opacity-50'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${unlocked ? 'bg-[#84cc16]/10' : 'bg-white/5'}`}>
        {badge.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{badge.name}</p>
        <p className="text-white/35 text-xs mt-0.5 truncate">{badge.desc}</p>
      </div>
      <div className="flex-shrink-0">
        {unlocked ? (
          <div className="w-5 h-5 rounded-full bg-[#84cc16] flex items-center justify-center">
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none" stroke="#0a0a0a" strokeWidth="2.5"><polyline points="1,4 4,7 9,1" /></svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center">
            <svg className="w-2.5 h-2.5" viewBox="0 0 9 11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
              <rect x="1.5" y="4.5" width="6" height="5.5" rx="1" /><path d="M3 4.5V3a1.5 1.5 0 013 0v1.5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
 
// ── MAIN COMPONENT ─────────────────────────────────────────────
export default function Profiel() {
  const { user, updateNaam, verwijderAccount } = useAuthContext()
  const navigate = useNavigate()
 
  // ✅ useStats voor stappen-data (consistent met Dashboard)
  const { totaalStappen, dagdoel: statsDagdoel, laden: statsLaden } = useStats(user?.uid)
  const { verdiendeBadges, loading: badgesLaden } = useBadges(user?.uid)
 
  // Lokale state
  const [teamNaam, setTeamNaam] = useState('')
  const [dagdoel, setDagdoel] = useState(DEFAULT_DAGDOEL)
  const [bewerkOpen, setBewerkOpen] = useState(false)
  const [verwijderOpen, setVerwijderOpen] = useState(false)
  const [bewerkLaden, setBewerkLaden] = useState(false)
  const [verwijderLaden, setVerwijderLaden] = useState(false)
  
  // ✅ NIEUW: State voor inklapbare badges
  const [badgesUitgeklapt, setBadgesUitgeklapt] = useState(false)
 
  // ── Sync dagdoel vanuit useStats ─────────────────────────────
  useEffect(() => {
    if (statsDagdoel) {
      setDagdoel(statsDagdoel)
    }
  }, [statsDagdoel])
 
  // ── Real-time listener voor teamnaam ─────────────────────────
  useEffect(() => {
    if (!user?.uid || !user?.teamId || teamNaam) return
    
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      try {
        const data = snap.data() ?? {}
        if (data.teamId && !teamNaam) {
          const teamSnap = await getDoc(doc(db, 'teams', data.teamId))
          if (teamSnap.exists()) {
            setTeamNaam(teamSnap.data().naam ?? '')
          }
        }
      } catch (e) {
        console.warn('Kon teamnaam niet laden:', e)
      }
    })
    
    return () => unsub()
  }, [user?.uid, user?.teamId, teamNaam])
 
  // ── Handlers ─────────────────────────────────────────────────
  async function handleNaamOpslaan(nieuweNaam) {
    setBewerkLaden(true)
    try {
      await updateNaam(nieuweNaam)
      setBewerkOpen(false)
    } catch {
    } finally {
      setBewerkLaden(false)
    }
  }
 
  async function handleVerwijderen(wachtwoord) {
    setVerwijderLaden(true)
    try {
      await verwijderAccount(wachtwoord)
      navigate('/login')
    } finally {
      setVerwijderLaden(false)
    }
  }
 
  // ── Calculations ─────────────────────────────────────────────
  const nextMilestone = getNextMilestone(totaalStappen)
  const milestonePct = calculateMilestoneProgress(totaalStappen)
  const earnedCount = BADGE_DEF.filter(b => verdiendeBadges[b.id]).length
  const initials = (user?.naam ?? user?.email ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
 
  // ── Loading state ────────────────────────────────────────────
  if (statsLaden || badgesLaden) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" />
      </div>
    )
  }
 
  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {bewerkOpen && <BewerkModal huidigeNaam={user?.naam ?? ''} onOpslaan={handleNaamOpslaan} onSluiten={() => setBewerkOpen(false)} laden={bewerkLaden} />}
      {verwijderOpen && <VerwijderModal onBevestigen={handleVerwijderen} onSluiten={() => setVerwijderOpen(false)} laden={verwijderLaden} />}
 
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#84cc16]/[0.04] rounded-full blur-3xl" />
      </div>
 
      <div className="relative max-w-sm mx-auto px-5 pb-12">
 
        {/* Header met avatar (initialen) */}
        <div className="flex items-center gap-4 pt-6 pb-5 border-b border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/25 flex items-center justify-center flex-shrink-0">
            <span className="text-[#84cc16] font-black text-lg">{initials}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xl tracking-tight truncate">{user?.naam ?? user?.email}</p>
            {teamNaam && (
              <div className="inline-flex items-center gap-1.5 mt-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-0.5">
                <span className="text-[#84cc16] text-[10px]">Team</span>
                <span className="text-white/40 text-xs">{teamNaam}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setBewerkOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-white/40 hover:text-white text-xs font-medium transition-all duration-200"
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" />
            </svg>
            Bewerken
          </button>
        </div>
 
        {/* Total steps via useStats */}
        <div className="relative mt-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#84cc16]/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-white/35 text-[10px] uppercase tracking-widest mb-2 font-medium">Totale stappen aller tijden</p>
          <p className="text-white font-black text-5xl tracking-tighter leading-none">
            {totaalStappen > 0 ? fmt(totaalStappen) : <span className="text-white/20">Nog geen stappen</span>}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16]" />
            <span className="text-white/35 text-xs">stappen geteld</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.07]">
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>Volgende mijlpaal</span>
              <span className="text-white/50">{fmt(nextMilestone)}</span>
            </div>
            <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#84cc16] rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${milestonePct}%` }} 
              />
            </div>
          </div>
        </div>
 
        {/* Dagdoel weergave */}
        <div className="mt-4 px-4 py-3.5 bg-white/[0.02] border border-white/[0.07] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🎯</span>
            <span className="text-white/50 text-sm">Persoonlijk dagdoel</span>
          </div>
          <span className="text-white/80 text-sm font-bold">{fmt(dagdoel)} stappen</span>
        </div>
 
        {/* ✅ Badges — nu inklapbaar */}
        <div className="mt-6">
          <button
            onClick={() => setBadgesUitgeklapt(!badgesUitgeklapt)}
            className="w-full flex items-center justify-between mb-3 group"
            aria-expanded={badgesUitgeklapt}
          >
            <h2 className="text-white font-black text-base tracking-tight">Badges</h2>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs">{earnedCount} / {BADGE_DEF.length} behaald</span>
              <span className={`text-white/40 transition-transform duration-200 ${badgesUitgeklapt ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>
          
          {/* Badges content — alleen zichtbaar als uitgeklapt */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${badgesUitgeklapt ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-2 pb-1">
              {BADGE_DEF.map(badge => (
                <BadgeRow key={badge.id} badge={badge} unlocked={!!verdiendeBadges[badge.id]} />
              ))}
            </div>
          </div>
          
          {/* Hint als badges ingeklapt zijn */}
          {!badgesUitgeklapt && earnedCount > 0 && (
            <p className="text-white/20 text-xs text-center py-2">
              {earnedCount} badge{earnedCount !== 1 ? 's' : ''} verborgen — klik om te bekijken ✨
            </p>
          )}
        </div>
 
        {/* Instellingen */}
        <div className="mt-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07]">
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium">Instellingen</p>
          </div>
          <button onClick={() => setBewerkOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left">
            <span className="text-white/70 text-sm">Naam wijzigen</span>
            <span className="text-white/20 text-xs">-&gt;</span>
          </button>
          <div className="border-t border-white/[0.07]" />
          <button onClick={() => setVerwijderOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-500/[0.04] transition-colors text-left">
            <span className="text-red-400/70 text-sm">Account verwijderen</span>
            <span className="text-red-400/20 text-xs">-&gt;</span>
          </button>
        </div>
 
        <button onClick={() => navigate('/dashboard')} className="mt-4 w-full py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all duration-200">
          terug naar dashboard
        </button>
 
      </div>
    </div>
  )
}