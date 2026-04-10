/**
 * Pagina voor teambeheer: zoeken, aanmaken en verlaten.
 * @returns {JSX.Element}
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { zoekTeamOpCode, sluitAanBijTeam, maakTeamAan, laadTeamDetails, verlatenTeam } from '../utils/teamCode'
import { doc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

// ── Helper: format getallen ───────────────────────────────────
function fmt(n) {
  return n?.toLocaleString('nl-NL') ?? '0'
}

export default function Team() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────
  const [scherm, setScherm] = useState('keuze')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  const [code, setCode] = useState('')
  const [gevondenTeam, setGevondenTeam] = useState(null)
  const [teamnaam, setTeamnaam] = useState('')
  const [nieuwTeam, setNieuwTeam] = useState(null)

  // ── Team details state (voor bestaande teamleden) ──────────
  const [teamDetails, setTeamDetails] = useState(null)
  const [detailLaden, setDetailLaden] = useState(false)
  const [verlatenLaden, setVerlatenLaden] = useState(false)
  const [toonBevestiging, setToonBevestiging] = useState(false)

  // ── Teamdoel state (alleen voor creator/admin) ─────────────
  const [teamDoel, setTeamDoel] = useState(10000)
  const [teamDoelInput, setTeamDoelInput] = useState('')
  const [teamDoelLaden, setTeamDoelLaden] = useState(false)
  const [teamDoelFout, setTeamDoelFout] = useState('')
  const [teamDoelOpgeslagen, setTeamDoelOpgeslagen] = useState(false)

  // ── Real-time listener voor team updates ───────────────────
  useEffect(() => {
    if (!user?.teamId) return

    let unsub

    const initTeam = async () => {
      setDetailLaden(true)
      try {
        const details = await laadTeamDetails(user.teamId)
        setTeamDetails(details)
        const doel = details?.teamDoel ?? 10000
        setTeamDoel(doel)
        setTeamDoelInput(String(doel))
      } finally {
        setDetailLaden(false)
      }

      // Real-time listener voor teamdoel updates
      unsub = onSnapshot(doc(db, 'teams', user.teamId), (snap) => {
        const data = snap.data()
        if (data?.teamDoel !== undefined && data.teamDoel !== teamDoel) {
          setTeamDoel(data.teamDoel)
          setTeamDoelInput(String(data.teamDoel))
        }
        if (data?.huidigeStappen !== undefined && teamDetails?.huidigeStappen !== data.huidigeStappen) {
          setTeamDetails(prev => prev ? { ...prev, huidigeStappen: data.huidigeStappen } : null)
        }
        if (data?.naam && teamDetails?.naam !== data.naam) {
          setTeamDetails(prev => prev ? { ...prev, naam: data.naam } : null)
        }
      })
    }

    initTeam()
    return () => unsub?.()
  }, [user?.teamId])

  // ── Helpers ────────────────────────────────────────────────
  function reset(nieuwScherm) {
    setFout('')
    setCode('')
    setTeamnaam('')
    setGevondenTeam(null)
    setScherm(nieuwScherm)
  }

  // ── Handlers ───────────────────────────────────────────────
  async function handleZoekTeam(e) {
    e.preventDefault()
    if (!code.trim()) { setFout('Vul een join-code in.'); return }
    setLaden(true); setFout('')
    try {
      const team = await zoekTeamOpCode(code)
      if (!team) { setFout('Deze code bestaat niet.'); return }
      setGevondenTeam(team)
      setScherm('bevestig')
    } catch {
      setFout('Er ging iets mis.')
    } finally {
      setLaden(false)
    }
  }

  async function handleAansluiten() {
    setLaden(true); setFout('')
    try {
      await sluitAanBijTeam(user.uid, gevondenTeam.id)
      setScherm('succes-aangesloten')
    } catch {
      setFout('Fout bij aansluiten.')
    } finally {
      setLaden(false)
    }
  }

  async function handleTeamAanmaken(e) {
    e.preventDefault()
    if (!teamnaam.trim()) return setFout('Vul een teamnaam in.')
    setLaden(true); setFout('')
    try {
      const team = await maakTeamAan(user.uid, teamnaam)
      setNieuwTeam(team)
      setScherm('succes-aangemaakt')
    } catch (err) {
      console.error(err)
      setFout('Fout bij aanmaken.')
    } finally {
      setLaden(false)
    }
  }

  async function handleVerlaten() {
    setVerlatenLaden(true)
    try {
      await verlatenTeam(user.uid)
      navigate('/dashboard')
    } catch {
      setFout('Verlaten mislukt.')
    } finally {
      setVerlatenLaden(false)
    }
  }

  async function handleTeamDoelOpslaan(e) {
    e.preventDefault()
    const aantal = parseInt(teamDoelInput, 10)
    
    if (!teamDoelInput || isNaN(aantal)) {
      setTeamDoelFout('Vul een geldig aantal stappen in.')
      return
    }
    if (aantal < 1000) {
      setTeamDoelFout('Minimaal 1.000 stappen als teamdoel.')
      return
    }
    if (aantal > 100000) {
      setTeamDoelFout('Maximaal 100.000 stappen als teamdoel.')
      return
    }

    setTeamDoelLaden(true)
    setTeamDoelFout('')
    
    try {
      await updateDoc(doc(db, 'teams', user.teamId), { 
        teamDoel: aantal,
        updatedAt: serverTimestamp()
      })
      setTeamDoel(aantal)
      setTeamDoelOpgeslagen(true)
      setTimeout(() => setTeamDoelOpgeslagen(false), 3000)
    } catch (err) {
      console.error('Fout bij updaten teamdoel:', err)
      setTeamDoelFout('Opslaan mislukt. Controleer je verbinding.')
    } finally {
      setTeamDoelLaden(false)
    }
  }

  // ── Subcomponents ──────────────────────────────────────────
  const BackButton = ({ onClick, className = '' }) => (
    <button
      type="button"
      onClick={onClick}
      className={`text-white/30 hover:text-white/60 text-sm font-medium py-2 transition-colors duration-200 hover:underline ${className}`}
    >
      ← Terug
    </button>
  )

  const PrimaryButton = ({ onClick, type = 'button', disabled, children, className = '' }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-[#84cc16] hover:bg-[#95d926] active:bg-[#74b312] disabled:bg-[#84cc16]/40 disabled:cursor-not-allowed text-[#0a0a0a] text-sm font-bold rounded-xl py-4 transition-all duration-150 shadow-lg shadow-[#84cc16]/20 hover:scale-[1.01] active:scale-[0.99] ${className}`}
    >
      {disabled ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Even wachten…
        </span>
      ) : children}
    </button>
  )

  const SecondaryButton = ({ onClick, children, className = '', ...props }) => (
    <button
      onClick={onClick}
      className={`w-full bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium rounded-xl py-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${className}`}
      {...props}
    >
      {children}
    </button>
  )

  const TextInput = ({ value, onChange, placeholder, autoFocus, type = 'text' }) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-[#84cc16]/50 rounded-xl px-5 py-4 text-white text-base placeholder:text-white/25 outline-none transition-all duration-200 caret-[#84cc16] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )

  const ErrorMsg = ({ msg }) => msg ? (
    <p className="text-red-400/90 text-sm font-medium flex items-center gap-2 animate-fade-in" role="alert">
      <span className="text-red-400">✕</span> {msg}
    </p>
  ) : null

  const SectionHeader = ({ icon, title, description }) => (
    <div className="animate-fade-in space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[#84cc16] text-xl">{icon}</span>
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-white/40 text-sm">{description}</p>}
        </div>
      </div>
    </div>
  )

  // ── Voortgangsbalk Component voor teamdoel ──────────────────
  const TeamProgressCard = ({ huidige, doel }) => {
    const percentage = Math.min(100, Math.round((huidige / doel) * 100))
    const isComplete = percentage >= 100
    
    const barColor = isComplete 
      ? 'bg-[#84cc16]' 
      : percentage >= 80 
        ? 'bg-[#a3d94e]' 
        : percentage >= 50 
          ? 'bg-[#fbbf24]' 
          : 'bg-[#60a5fa]'
    
    const glowColor = isComplete
      ? 'shadow-[#84cc16]/40'
      : percentage >= 80
        ? 'shadow-[#a3d94e]/30'
        : percentage >= 50
          ? 'shadow-[#fbbf24]/30'
          : 'shadow-[#60a5fa]/30'

    return (
      <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-semibold text-base">Teamvoortgang vandaag</h4>
          {isComplete && (
            <span className="text-[#84cc16] text-xs font-bold uppercase tracking-wider bg-[#84cc16]/10 px-2 py-1 rounded-full border border-[#84cc16]/20">
              ✓ Doel behaald!
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">
              {fmt(huidige)} stappen
            </span>
            <span className="text-white/40">
              {percentage}% van {fmt(doel)}
            </span>
          </div>
          
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out shadow-lg ${glowColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {!isComplete && (
            <p className="text-xs text-white/40">
              Nog {fmt(doel - (huidige || 0))} stappen te gaan 🚶
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── MemberRow Component met totale stappen ──────────────────
  const MemberRow = ({ lid, isCurrentUser }) => {
    const [memberTotalSteps, setMemberTotalSteps] = useState(0)
    const [memberLoading, setMemberLoading] = useState(true)

    // Load totalSteps for this member
    useEffect(() => {
      if (!lid?.uid) return
      let unsub
      const loadSteps = onSnapshot(doc(db, 'users', lid.uid), (snap) => {
        const data = snap.data()
        setMemberTotalSteps(typeof data?.totalSteps === 'number' ? data.totalSteps : 0)
        setMemberLoading(false)
      })
      unsub = loadSteps
      return () => unsub?.()
    }, [lid?.uid])

    const initials = (lid.naam ?? lid.email ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

    return (
      <div className="flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 group">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#84cc16]/20 to-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white/90 font-medium text-sm truncate">{lid.naam ?? lid.email}</p>
            {isCurrentUser && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#84cc16]/20 text-[#84cc16] px-2 py-0.5 rounded-full">
                Jij
              </span>
            )}
          </div>
          {lid.naam && <p className="text-white/30 text-xs truncate">{lid.email}</p>}
          {/* Totale stappen allertijden */}
          <p className="text-[#84cc16]/80 text-xs font-medium mt-1 flex items-center gap-1">
            <span className="text-[10px]">👟</span>
            {memberLoading ? (
              <span className="text-white/20">Laden…</span>
            ) : (
              <>{fmt(memberTotalSteps)} stappen allertijd</>
            )}
          </p>
        </div>
      </div>
    )
  }

  const isCreatorOfAdmin = user?.role === 'admin' || user?.uid === teamDetails?.aangemaaktDoor

  // ── Al in een team → team details pagina ──────────────────
  if (user?.teamId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Animated background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#84cc16]/[0.03] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#84cc16]/[0.02] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-10 space-y-8">

          {/* Navbar */}
          <header className="animate-slide-down flex items-center justify-between pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[#84cc16] text-2xl leading-none">⬡</span>
              <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-4 py-2 hover:bg-white/[0.04]"
            >
              ← Dashboard
            </button>
          </header>

          {/* Page header */}
          <div className="animate-fade-in">
            <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">teamoverzicht</p>
            <h1 className="text-4xl font-black tracking-tight">Jouw Team</h1>
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in-delay-1">

            {/* Left: Team info & join code */}
            <div className="lg:col-span-2 space-y-6">

              {/* Team card */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-sm hover:border-[#84cc16]/20 transition-colors duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-white font-bold text-xl">
                      {detailLaden ? 'Laden…' : (teamDetails?.naam ?? user.teamId)}
                    </h3>
                    <p className="text-white/40 text-sm mt-1">
                      Team-ID: <span className="font-mono text-white/60">{user.teamId}</span>
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/20 flex items-center justify-center">
                    <span className="text-[#84cc16] text-2xl">⬡</span>
                  </div>
                </div>

                {/* Join code */}
                {teamDetails?.joinCode && (
                  <div className="bg-[#84cc16]/[0.06] border border-[#84cc16]/20 rounded-2xl p-6">
                    <p className="text-[#84cc16]/70 text-xs uppercase tracking-widest mb-2 font-medium">Deel deze join-code</p>
                    <div className="flex items-center gap-4">
                      <p className="text-[#84cc16] text-4xl font-black tracking-[0.15em] font-mono">
                        {teamDetails.joinCode}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(teamDetails.joinCode)}
                        className="text-xs text-white/50 hover:text-[#84cc16] border border-white/10 hover:border-[#84cc16]/30 rounded-lg px-3 py-1.5 transition-all"
                        aria-label="Join-code kopiëren"
                      >
                        Kopiëren
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Members list — MET TOTALE STAPPEN */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-lg">Teamleden</h3>
                  <span className="text-sm text-white/40 bg-white/[0.04] px-3 py-1 rounded-full">
                    {detailLaden ? '…' : (teamDetails?.leden?.length ?? 0)}
                  </span>
                </div>

                {detailLaden ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl animate-pulse">
                        <div className="w-12 h-12 rounded-xl bg-white/5" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/5 rounded w-32" />
                          <div className="h-3 bg-white/5 rounded w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {teamDetails?.leden?.map(lid => (
                      <MemberRow 
                        key={lid.uid} 
                        lid={lid} 
                        isCurrentUser={lid.uid === user.uid} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions sidebar */}
            <div className="space-y-4">

              {/* 🎯 Teamvoortgangsbalk - voor ALLE teamleden */}
              <TeamProgressCard 
                huidige={teamDetails?.huidigeStappen ?? 0} 
                doel={teamDoel} 
              />

              {/* Quick stats */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm">
                <h4 className="text-white/60 text-xs uppercase tracking-widest mb-4">Snelle info</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Gemaakt op</span>
                    <span className="text-white/80 text-sm font-medium">
                      {(() => {
                        const d = teamDetails?.gemaaktOp
                        if (!d) return '—'
                        if (typeof d.toDate === 'function') return d.toDate().toLocaleDateString('nl-NL')
                        if (d instanceof Date) return d.toLocaleDateString('nl-NL')
                        return '—'
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Teamdoel</span>
                    <span className="text-white/80 text-sm font-medium">
                      {fmt(teamDoel)} stappen/dag
                    </span>
                  </div>
                </div>
              </div>

              {/* Teamdoel instellen — alleen voor creator/admin */}
              {isCreatorOfAdmin && (
                <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-black/10 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-white font-semibold text-base tracking-tight">Teamdoel instellen</h4>
                      <p className="text-white/40 text-xs">
                        Huidig:{' '}
                        <span className="text-white/70 font-medium">{fmt(teamDoel)} stappen/dag</span>
                      </p>
                    </div>
                    <div className="bg-[#84cc16]/10 border border-[#84cc16]/20 rounded-lg p-2">
                      <span className="text-[#84cc16] text-lg">🎯</span>
                    </div>
                  </div>

                  <form onSubmit={handleTeamDoelOpslaan} noValidate className="space-y-4">
                    <div className="relative">
                      <input
                        type="number"
                        min="1000"
                        max="100000"
                        step="100"
                        placeholder="bijv. 12000"
                        value={teamDoelInput}
                        onChange={(e) => { setTeamDoelInput(e.target.value); setTeamDoelFout('') }}
                        aria-label="Nieuw teamdoel in stappen"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#84cc16]/60 focus:ring-2 focus:ring-[#84cc16]/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={teamDoelLaden}
                      aria-busy={teamDoelLaden}
                      className="w-full bg-[#84cc16] hover:bg-[#95d926] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-semibold text-sm rounded-xl px-6 py-3 transition-all duration-200 shadow-lg shadow-[#84cc16]/20 hover:shadow-[#84cc16]/30 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {teamDoelLaden && (
                        <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                      )}
                      {teamDoelLaden ? 'Opslaan...' : 'Doel bijwerken'}
                    </button>
                  </form>

                  <div className="space-y-2 min-h-[20px]" aria-live="polite">
                    {teamDoelFout && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5 animate-fade-in">
                        <span>⚠️</span> {teamDoelFout}
                      </p>
                    )}
                    {teamDoelOpgeslagen && (
                      <p className="text-[#84cc16] text-xs flex items-center gap-1.5 animate-slide-up">
                        <span>✓</span> Teamdoel succesvol bijgewerkt!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Leave team card */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm">
                <h4 className="text-white font-bold mb-4">Teambeheer</h4>

                {!toonBevestiging ? (
                  <button
                    onClick={() => setToonBevestiging(true)}
                    className="w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 text-sm font-medium rounded-xl py-3.5 transition-all text-left px-4 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Team verlaten
                  </button>
                ) : (
                  <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 space-y-4">
                    <p className="text-red-400/90 text-sm">Weet je zeker dat je dit team wilt verlaten?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setToonBevestiging(false)}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm rounded-lg py-2.5 transition-all"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={handleVerlaten}
                        disabled={verlatenLaden}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 border border-red-500/30 text-red-400 text-sm font-bold rounded-lg py-2.5 transition-all"
                      >
                        {verlatenLaden ? 'Bezig…' : 'Verlaten'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Back to dashboard */}
              <SecondaryButton onClick={() => navigate('/dashboard')}>
                ← Terug naar dashboard
              </SecondaryButton>

            </div>
          </div>

          <p className="text-center text-white/15 text-xs tracking-wide pt-8">Stapril</p>
        </div>
      </div>
    )
  }

  // ── Nog geen team → aanmaken / aansluiten ─────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#84cc16]/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#84cc16]/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl animate-fade-in">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-4 py-2 hover:bg-white/[0.04]"
          >
            ← Dashboard
          </button>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-10 backdrop-blur-sm space-y-8">

          {/* KEUZE */}
          {scherm === 'keuze' && (
            <div className="space-y-8">
              <SectionHeader
                icon="⬡"
                title="Team"
                description="Maak een nieuw team aan of sluit je aan bij een bestaand team met een join-code."
              />
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => reset('aanmaken')}
                  className="group bg-[#84cc16] hover:bg-[#95d926] active:bg-[#74b312] text-[#0a0a0a] rounded-2xl p-6 text-left transition-all duration-200 shadow-lg shadow-[#84cc16]/20 hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent hover:border-[#84cc16]/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">✨</span>
                    <span className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-xl">→</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Team aanmaken</h3>
                  <p className="text-[#0a0a0a]/60 text-sm">Start een nieuw team en nodig anderen uit</p>
                </button>

                <button
                  onClick={() => reset('aansluiten')}
                  className="group bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🔗</span>
                    <span className="opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all text-xl">→</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Aansluiten</h3>
                  <p className="text-white/40 text-sm">Voer een join-code in om lid te worden</p>
                </button>
              </div>
            </div>
          )}

          {/* AANMAKEN */}
          {scherm === 'aanmaken' && (
            <form onSubmit={handleTeamAanmaken} className="space-y-6">
              <SectionHeader
                icon="✨"
                title="Team aanmaken"
                description="Geef je team een herkenbare naam."
              />
              <div className="space-y-4">
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-widest mb-2">Teamnaam</label>
                  <TextInput value={teamnaam} onChange={(e) => setTeamnaam(e.target.value)} placeholder="Bijv. Marketing Q2" autoFocus />
                </div>
                <ErrorMsg msg={fout} />
              </div>
              <div className="flex gap-3 pt-2">
                <PrimaryButton type="submit" disabled={laden} className="flex-1">Aanmaken</PrimaryButton>
                <BackButton onClick={() => reset('keuze')} className="self-center" />
              </div>
            </form>
          )}

          {/* AANSLUITEN */}
          {scherm === 'aansluiten' && (
            <form onSubmit={handleZoekTeam} className="space-y-6">
              <SectionHeader
                icon="🔗"
                title="Aansluiten bij team"
                description="Voer de 6-cijferige join-code in die je hebt ontvangen."
              />
              <div className="space-y-4">
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-widest mb-2">Join-code</label>
                  <TextInput
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXX"
                    autoFocus
                    type="text"
                  />
                  <p className="text-white/25 text-xs mt-2 font-mono">Code is niet hoofdlettergevoelig</p>
                </div>
                <ErrorMsg msg={fout} />
              </div>
              <div className="flex gap-3 pt-2">
                <PrimaryButton type="submit" disabled={laden} className="flex-1">Team zoeken</PrimaryButton>
                <BackButton onClick={() => reset('keuze')} className="self-center" />
              </div>
            </form>
          )}

          {/* BEVESTIG */}
          {scherm === 'bevestig' && gevondenTeam && (
            <div className="space-y-6">
              <SectionHeader
                icon="✓"
                title="Team gevonden"
                description="Wil je je aansluiten bij dit team?"
              />
              <div className="bg-[#84cc16]/[0.08] border border-[#84cc16]/25 rounded-2xl p-6 flex items-center gap-4 hover:border-[#84cc16]/40 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#84cc16] text-2xl">⬡</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg">{gevondenTeam.naam}</p>
                  <p className="text-white/40 text-sm font-mono mt-0.5">{gevondenTeam.id}</p>
                </div>
              </div>
              <ErrorMsg msg={fout} />
              <div className="flex gap-3 pt-2">
                <PrimaryButton onClick={handleAansluiten} disabled={laden} className="flex-1">Aansluiten</PrimaryButton>
                <BackButton onClick={() => reset('aansluiten')} className="self-center" />
              </div>
            </div>
          )}

          {/* SUCCES AANGEMAAKT */}
          {scherm === 'succes-aangemaakt' && nieuwTeam && (
            <div className="space-y-8 text-center">
              <div className="space-y-4 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#84cc16]/10 border border-[#84cc16]/25 mx-auto shadow-lg shadow-[#84cc16]/10">
                  <span className="text-[#84cc16] text-4xl">✓</span>
                </div>
                <div>
                  <h2 className="text-white text-2xl font-bold tracking-tight">Team aangemaakt!</h2>
                  <p className="text-white/40 text-sm mt-2 max-w-sm mx-auto">Deel deze code met je teamleden zodat ze kunnen aansluiten.</p>
                </div>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl py-6 px-8 hover:border-[#84cc16]/30 transition-colors">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-medium">Join-code</p>
                <p className="text-[#84cc16] text-5xl font-black tracking-[0.2em] font-mono">{nieuwTeam.joinCode}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(nieuwTeam.joinCode)}
                  className="mt-4 text-xs text-white/50 hover:text-[#84cc16] border border-white/10 hover:border-[#84cc16]/30 rounded-lg px-4 py-2 transition-all"
                  aria-label="Join-code kopiëren"
                >
                  📋 Kopiëren
                </button>
              </div>
              <div className="flex gap-3">
                <PrimaryButton onClick={() => navigate('/dashboard')} className="flex-1">Ga naar dashboard</PrimaryButton>
                <SecondaryButton onClick={() => navigate(-1)} className="flex-1 max-w-[140px]">Terug</SecondaryButton>
              </div>
            </div>
          )}

          {/* SUCCES AANGESLOTEN */}
          {scherm === 'succes-aangesloten' && (
            <div className="space-y-8 text-center">
              <div className="space-y-4 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#84cc16]/10 border border-[#84cc16]/25 mx-auto shadow-lg shadow-[#84cc16]/10">
                  <span className="text-[#84cc16] text-4xl">⬡</span>
                </div>
                <div>
                  <h2 className="text-white text-2xl font-bold tracking-tight">Welkom bij het team!</h2>
                  <p className="text-white/40 text-sm mt-2">Je bent succesvol toegevoegd. Samen stappen!</p>
                </div>
              </div>
              <div className="flex gap-3">
                <PrimaryButton onClick={() => navigate('/dashboard')} className="flex-1">Ga naar dashboard</PrimaryButton>
                <SecondaryButton onClick={() => navigate(-1)} className="flex-1 max-w-[140px]">Terug</SecondaryButton>
              </div>
            </div>
          )}

        </div>
        <p className="text-center text-white/15 text-xs mt-6 tracking-wide">Stapril</p>
      </div>
    </div>
  )
}