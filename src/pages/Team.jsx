import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { zoekTeamOpCode, sluitAanBijTeam, maakTeamAan } from '../utils/teamCode'
 
// 'keuze' | 'aanmaken' | 'aansluiten' | 'bevestig' | 'succes-aangemaakt' | 'succes-aangesloten'
 
export default function Team() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
 
  const [scherm, setScherm] = useState('keuze')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')
 
  // Aansluiten state
  const [code, setCode] = useState('')
  const [gevondenTeam, setGevondenTeam] = useState(null)
 
  // Aanmaken state
  const [teamnaam, setTeamnaam] = useState('')
  const [nieuwTeam, setNieuwTeam] = useState(null)
 
  function reset(nieuwScherm) {
    setFout('')
    setCode('')
    setTeamnaam('')
    setGevondenTeam(null)
    setScherm(nieuwScherm)
  }
 
  // ── Al in een team ──────────────────────────────────────────────────────────
  if (user?.teamId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <span className="text-[#84cc16] text-4xl">⬡</span>
          <h2 className="text-white text-2xl font-black">Je zit al in een team</h2>
          <p className="text-white/30 text-sm">
            Je bent al lid van team{' '}
            <span className="text-white/60">{user.teamId}</span>.
            Een deelnemer kan maar lid zijn van één team.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg py-3 transition-colors"
          >
            Terug naar dashboard
          </button>
        </div>
      </div>
    )
  }
 
  // ── Handlers ────────────────────────────────────────────────────────────────
 
  async function handleZoekTeam(e) {
    e.preventDefault()
    if (!code.trim()) { setFout('Vul een join-code in.'); return }
    setLaden(true); setFout('')
    try {
      const team = await zoekTeamOpCode(code)
      if (!team) { setFout('Deze code bestaat niet. Controleer de code en probeer opnieuw.'); return }
      setGevondenTeam(team)
      setScherm('bevestig')
    } catch {
      setFout('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setLaden(false)
    }
  }
 
  async function handleAansluiten() {
    setLaden(true); setFout('')
    try {
      await sluitAanBijTeam(user.uid, gevondenTeam.id)
      setScherm('succes-aangesloten')
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch {
      setFout('Er ging iets mis bij het aansluiten. Probeer het opnieuw.')
    } finally {
      setLaden(false)
    }
  }
 
  async function handleTeamAanmaken(e) {
    e.preventDefault()
    if (!teamnaam.trim()) { setFout('Vul een teamnaam in.'); return }
    if (teamnaam.trim().length < 2) { setFout('Teamnaam moet minimaal 2 tekens zijn.'); return }
    setLaden(true); setFout('')
    try {
      const team = await maakTeamAan(user.uid, teamnaam)
      setNieuwTeam(team)
      setScherm('succes-aangemaakt')
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch {
      setFout('Er ging iets mis bij het aanmaken. Probeer het opnieuw.')
    } finally {
      setLaden(false)
    }
  }
 
  // ── Layout wrapper ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] grid md:grid-cols-2">
 
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-[#0f0f0f] border-r border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-2xl leading-none">⬡</span>
          <span className="text-white text-xl font-bold tracking-widest uppercase">Stapril</span>
        </div>
        <div>
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-4">samen sterker</p>
          <h1 className="text-white font-black leading-[0.9] text-[clamp(3rem,5vw,5.5rem)] tracking-tight">
            {scherm === 'aanmaken' ? <>Maak<br />jouw<br />team.</> : <>Sluit aan<br />bij je<br />team.</>}
          </h1>
        </div>
        <div className="flex items-center gap-8 pt-8 border-t border-white/5">
          {[['10K', 'stappen/dag'], ['30', 'dagen'], ['∞', 'teams']].map(([num, lbl]) => (
            <div key={lbl}>
              <div className="text-white text-3xl font-black leading-none">{num}</div>
              <div className="text-white/30 text-xs uppercase tracking-widest mt-1">{lbl}</div>
            </div>
          ))}
        </div>
      </div>
 
      {/* Right panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
 
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <span className="text-[#84cc16] text-xl leading-none">⬡</span>
            <span className="text-white text-lg font-bold tracking-widest uppercase">Stapril</span>
          </div>
 
          {/* ── Keuze ── */}
          {scherm === 'keuze' && (
            <>
              <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Team</h2>
              <p className="text-white/30 text-sm mb-8">
                Maak een nieuw team aan of sluit je aan bij een bestaand team.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => reset('aanmaken')}
                  className="w-full bg-[#84cc16] hover:bg-[#95d926] active:scale-[0.98] text-[#0a0a0a] font-bold text-sm rounded-lg py-3 transition-all"
                >
                  Team aanmaken
                </button>
                <button
                  onClick={() => reset('aansluiten')}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm rounded-lg py-3 transition-colors"
                >
                  Aansluiten via join-code
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-white/30 hover:text-white/60 text-sm transition-colors py-2"
                >
                  Terug naar dashboard
                </button>
              </div>
            </>
          )}
 
          {/* ── Team aanmaken ── */}
          {scherm === 'aanmaken' && (
            <>
              <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Team aanmaken</h2>
              <p className="text-white/30 text-sm mb-8">
                Kies een naam voor je team. Er wordt automatisch een unieke join-code gegenereerd.
              </p>
              <form onSubmit={handleTeamAanmaken} noValidate className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs uppercase tracking-widest" htmlFor="teamnaam">
                    Teamnaam
                  </label>
                  <input
                    id="teamnaam"
                    name="teamnaam"
                    type="text"
                    autoComplete="off"
                    placeholder="bijv. De Snelle Stappers"
                    value={teamnaam}
                    onChange={(e) => { setTeamnaam(e.target.value); setFout('') }}
                    maxLength={40}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-lg px-3.5 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
                  />
                </div>
 
                {fout && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {fout}
                  </div>
                )}
 
                <button
                  type="submit"
                  disabled={laden}
                  className="w-full bg-[#84cc16] hover:bg-[#95d926] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    text-[#0a0a0a] font-bold text-sm rounded-lg py-3 transition-all flex items-center justify-center gap-2"
                >
                  {laden && <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />}
                  {laden ? 'Aanmaken...' : 'Team aanmaken'}
                </button>
                <button type="button" onClick={() => reset('keuze')} className="w-full text-white/30 hover:text-white/60 text-sm transition-colors py-2">
                  Terug
                </button>
              </form>
            </>
          )}
 
          {/* ── Aansluiten via code ── */}
          {scherm === 'aansluiten' && (
            <>
              <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Join-code invoeren</h2>
              <p className="text-white/30 text-sm mb-8">
                Vraag de code op bij je teamleider en vul hem hieronder in.
              </p>
              <form onSubmit={handleZoekTeam} noValidate className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs uppercase tracking-widest" htmlFor="code">
                    Join-code
                  </label>
                  <input
                    id="code"
                    type="text"
                    autoComplete="off"
                    placeholder="bijv. STAP42"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setFout('') }}
                    maxLength={12}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-lg px-3.5 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors tracking-widest uppercase"
                  />
                </div>
 
                {fout && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {fout}
                  </div>
                )}
 
                <button
                  type="submit"
                  disabled={laden}
                  className="w-full bg-[#84cc16] hover:bg-[#95d926] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    text-[#0a0a0a] font-bold text-sm rounded-lg py-3 transition-all flex items-center justify-center gap-2"
                >
                  {laden && <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />}
                  {laden ? 'Zoeken...' : 'Team zoeken'}
                </button>
                <button type="button" onClick={() => reset('keuze')} className="w-full text-white/30 hover:text-white/60 text-sm transition-colors py-2">
                  Terug
                </button>
              </form>
            </>
          )}
 
          {/* ── Bevestig aansluiten ── */}
          {scherm === 'bevestig' && gevondenTeam && (
            <>
              <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Team gevonden</h2>
              <p className="text-white/30 text-sm mb-8">Wil je je aansluiten bij dit team?</p>
 
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[#84cc16] text-2xl">⬡</span>
                  <div>
                    <p className="text-white font-bold">{gevondenTeam.naam || 'Onbekend team'}</p>
                    <p className="text-white/30 text-xs">
                      {gevondenTeam.leden?.length ?? 0} leden · Code: {gevondenTeam.joinCode}
                    </p>
                  </div>
                </div>
              </div>
 
              {fout && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
                  {fout}
                </div>
              )}
 
              <div className="space-y-3">
                <button
                  onClick={handleAansluiten}
                  disabled={laden}
                  className="w-full bg-[#84cc16] hover:bg-[#95d926] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    text-[#0a0a0a] font-bold text-sm rounded-lg py-3 transition-all flex items-center justify-center gap-2"
                >
                  {laden && <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />}
                  {laden ? 'Aansluiten...' : 'Ja, aansluiten'}
                </button>
                <button type="button" onClick={() => reset('aansluiten')} className="w-full text-white/30 hover:text-white/60 text-sm transition-colors py-2">
                  Andere code invoeren
                </button>
              </div>
            </>
          )}
 
          {/* ── Succes: team aangemaakt ── */}
          {scherm === 'succes-aangemaakt' && nieuwTeam && (
            <div className="text-center space-y-5">
              <div className="text-[#84cc16] text-5xl">⬡</div>
              <h2 className="text-white text-2xl font-bold">Team aangemaakt!</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-3">
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Teamnaam</p>
                  <p className="text-white font-bold">{nieuwTeam.naam}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Join-code</p>
                  <p className="text-[#84cc16] font-black text-2xl tracking-widest">{nieuwTeam.joinCode}</p>
                  <p className="text-white/20 text-xs mt-1">Deel deze code met je collega's</p>
                </div>
              </div>
              <p className="text-white/30 text-sm">Je wordt doorgestuurd naar je dashboard...</p>
            </div>
          )}
 
          {/* ── Succes: aangesloten ── */}
          {scherm === 'succes-aangesloten' && (
            <div className="text-center space-y-4">
              <div className="text-[#84cc16] text-5xl">✓</div>
              <h2 className="text-white text-2xl font-bold">Welkom bij het team!</h2>
              <p className="text-white/30 text-sm">Je wordt doorgestuurd naar je dashboard...</p>
            </div>
          )}
 
        </div>
      </div>
    </div>
  )
}