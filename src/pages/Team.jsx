import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { zoekTeamOpCode, sluitAanBijTeam, maakTeamAan, laadTeamDetails, verlatenTeam } from '../utils/teamCode'

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

  useEffect(() => {
    if (!user?.teamId) return
    setDetailLaden(true)
    laadTeamDetails(user.teamId)
      .then(setTeamDetails)
      .finally(() => setDetailLaden(false))
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
    } catch {
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

  // ── Subcomponents ──────────────────────────────────────────
  const BackButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-white/30 hover:text-white/60 text-sm font-medium py-2 transition-colors duration-200"
    >
      ← Terug
    </button>
  )

  const PrimaryButton = ({ onClick, type = 'button', disabled, children }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-[#84cc16] hover:bg-[#95d926] active:bg-[#74b312] disabled:bg-[#84cc16]/40 disabled:cursor-not-allowed text-[#0a0a0a] text-sm font-bold rounded-xl py-3.5 transition-all duration-150 shadow-lg shadow-[#84cc16]/20"
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

  const TextInput = ({ value, onChange, placeholder, autoFocus }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.06] border border-white/10 focus:border-[#84cc16]/50 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/25 outline-none transition-all duration-200 caret-[#84cc16]"
    />
  )

  const ErrorMsg = ({ msg }) => msg ? (
    <p className="text-red-400/90 text-xs font-medium flex items-center gap-1.5">
      <span>✕</span> {msg}
    </p>
  ) : null

  // ── Al in een team → team details pagina ──────────────────
  if (user?.teamId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#84cc16]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm space-y-3">

          {/* Hoofdkaart */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 space-y-6 backdrop-blur-sm">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/20 flex items-center justify-center">
                <span className="text-[#84cc16] text-lg">⬡</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {detailLaden ? '…' : (teamDetails?.naam ?? user.teamId)}
                </h2>
                <p className="text-white/30 text-xs">Jouw team</p>
              </div>
            </div>

            {/* Join-code */}
            {teamDetails?.joinCode && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Join-code</p>
                <p className="text-[#84cc16] text-2xl font-black tracking-wider font-mono">
                  {teamDetails.joinCode}
                </p>
              </div>
            )}

            {/* Leden */}
            <div className="space-y-2">
              <p className="text-white/30 text-xs uppercase tracking-widest">
                Leden ({detailLaden ? '…' : (teamDetails?.leden?.length ?? '?')})
              </p>
              {detailLaden ? (
                <p className="text-white/20 text-sm">Laden…</p>
              ) : (
                <ul className="space-y-2">
                  {teamDetails?.leden?.map(lid => (
                    <li key={lid.uid} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/40 font-bold">
                        {(lid.naam ?? lid.email ?? '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white/80 text-sm leading-tight">{lid.naam ?? lid.email}</p>
                        {lid.naam && <p className="text-white/25 text-xs">{lid.email}</p>}
                      </div>
                      {lid.uid === user.uid && (
                        <span className="ml-auto text-[10px] text-[#84cc16]/60 uppercase tracking-widest">jij</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Acties */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-2 backdrop-blur-sm">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-white/5 hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white text-sm font-medium rounded-xl py-3 transition-all"
            >
              ← Terug naar dashboard
            </button>

            {!toonBevestiging ? (
              <button
                onClick={() => setToonBevestiging(true)}
                className="w-full text-red-400/60 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 text-sm font-medium rounded-xl py-3 transition-all"
              >
                Team verlaten
              </button>
            ) : (
              <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 space-y-3">
                <p className="text-red-400/80 text-sm text-center">Weet je het zeker?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setToonBevestiging(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm rounded-lg py-2.5 transition-all"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleVerlaten}
                    disabled={verlatenLaden}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 border border-red-500/30 text-red-400 text-sm font-bold rounded-lg py-2.5 transition-all"
                  >
                    {verlatenLaden ? 'Bezig…' : 'Ja, verlaten'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-white/15 text-xs tracking-wide">Stapril</p>
        </div>
      </div>
    )
  }

  // ── Nog geen team → aanmaken / aansluiten ─────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#84cc16]/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#84cc16]/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm">

          {/* KEUZE */}
          {scherm === 'keuze' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#84cc16] text-lg">⬡</span>
                </div>
                <h2 className="text-white text-2xl font-bold tracking-tight">Team</h2>
                <p className="text-white/35 text-sm">Maak een nieuw team aan of sluit je aan bij een bestaand team.</p>
              </div>
              <div className="space-y-3 pt-1">
                <button
                  onClick={() => reset('aanmaken')}
                  className="w-full bg-[#84cc16] hover:bg-[#95d926] active:bg-[#74b312] text-[#0a0a0a] text-sm font-bold rounded-xl py-3.5 transition-all duration-150 shadow-lg shadow-[#84cc16]/20 text-left px-5 flex items-center justify-between group"
                >
                  <span>Team aanmaken</span>
                  <span className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150">→</span>
                </button>
                <button
                  onClick={() => reset('aansluiten')}
                  className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium rounded-xl py-3.5 transition-all duration-200 text-left px-5 flex items-center justify-between group"
                >
                  <span>Aansluiten bij team</span>
                  <span className="opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all duration-150">→</span>
                </button>
              </div>
            </div>
          )}

          {/* AANMAKEN */}
          {scherm === 'aanmaken' && (
            <form onSubmit={handleTeamAanmaken} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-white text-xl font-bold tracking-tight">Team aanmaken</h2>
                <p className="text-white/35 text-sm">Geef je team een naam.</p>
              </div>
              <div className="space-y-3">
                <TextInput value={teamnaam} onChange={(e) => setTeamnaam(e.target.value)} placeholder="Teamnaam" autoFocus />
                <ErrorMsg msg={fout} />
              </div>
              <div className="space-y-2">
                <PrimaryButton type="submit" disabled={laden}>Aanmaken</PrimaryButton>
                <BackButton onClick={() => reset('keuze')} />
              </div>
            </form>
          )}

          {/* AANSLUITEN */}
          {scherm === 'aansluiten' && (
            <form onSubmit={handleZoekTeam} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-white text-xl font-bold tracking-tight">Aansluiten</h2>
                <p className="text-white/35 text-sm">Voer de join-code van je team in.</p>
              </div>
              <div className="space-y-3">
                <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="Join-code" autoFocus />
                <ErrorMsg msg={fout} />
              </div>
              <div className="space-y-2">
                <PrimaryButton type="submit" disabled={laden}>Team zoeken</PrimaryButton>
                <BackButton onClick={() => reset('keuze')} />
              </div>
            </form>
          )}

          {/* BEVESTIG */}
          {scherm === 'bevestig' && gevondenTeam && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-white text-xl font-bold tracking-tight">Team gevonden</h2>
                <p className="text-white/35 text-sm">Wil je je aansluiten bij dit team?</p>
              </div>
              <div className="bg-[#84cc16]/[0.06] border border-[#84cc16]/20 rounded-xl px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#84cc16]/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#84cc16] text-base leading-none">⬡</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{gevondenTeam.naam}</p>
                  <p className="text-white/35 text-xs mt-0.5">{gevondenTeam.id}</p>
                </div>
              </div>
              <ErrorMsg msg={fout} />
              <div className="space-y-2">
                <PrimaryButton onClick={handleAansluiten} disabled={laden}>Aansluiten</PrimaryButton>
                <BackButton onClick={() => reset('aansluiten')} />
              </div>
            </div>
          )}

          {/* SUCCES AANGEMAAKT */}
          {scherm === 'succes-aangemaakt' && nieuwTeam && (
            <div className="space-y-6 text-center">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/25 mx-auto">
                  <span className="text-[#84cc16] text-2xl">✓</span>
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold tracking-tight">Team aangemaakt!</h2>
                  <p className="text-white/35 text-sm mt-1">Deel deze code met je teamleden.</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl py-4 px-5">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-2 font-medium">Join-code</p>
                <p className="text-[#84cc16] text-3xl font-black tracking-wider font-mono">{nieuwTeam.joinCode}</p>
              </div>
              <div className="space-y-2">
                <PrimaryButton onClick={() => navigate('/dashboard')}>Ga naar dashboard</PrimaryButton>
                <BackButton onClick={() => navigate(-1)} />
              </div>
            </div>
          )}

          {/* SUCCES AANGESLOTEN */}
          {scherm === 'succes-aangesloten' && (
            <div className="space-y-6 text-center">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/25 mx-auto">
                  <span className="text-[#84cc16] text-2xl">⬡</span>
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold tracking-tight">Welkom bij het team!</h2>
                  <p className="text-white/35 text-sm mt-1">Je bent succesvol toegevoegd.</p>
                </div>
              </div>
              <div className="space-y-2">
                <PrimaryButton onClick={() => navigate('/dashboard')}>Ga naar dashboard</PrimaryButton>
                <BackButton onClick={() => navigate(-1)} />
              </div>
            </div>
          )}

        </div>
        <p className="text-center text-white/15 text-xs mt-5 tracking-wide">Stapril</p>
      </div>
    </div>
  )
}