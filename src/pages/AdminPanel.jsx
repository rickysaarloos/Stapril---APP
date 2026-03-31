import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthContext } from '../context/AuthContext'

export default function AdminPanel() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  const [gebruikers, setGebruikers] = useState([])
  const [teams, setTeams] = useState([])
  const [challengeStatus, setChallengeStatus] = useState(null)
  const [laden, setLaden] = useState(true)
  const [challengeLaden, setChallengeLaden] = useState(false)
  const [fout, setFout] = useState('')
  const [zoek, setZoek] = useState('')

  useEffect(() => {
    async function laadData() {
      try {
        const [gebruikersSnap, teamsSnap, stappenSnap, challengeSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'stappen')),
          getDoc(doc(db, 'instellingen', 'challenge')),
        ])

        const gebruikersList = gebruikersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const stappen = stappenSnap.docs.map(d => d.data())

        // Totale stappen per gebruiker
        const stappenPerUid = {}
        stappen.forEach(s => {
          stappenPerUid[s.uid] = (stappenPerUid[s.uid] ?? 0) + (s.stappen ?? 0)
        })

        // Gebruikers verrijken met totale stappen
        const gebruikersMetStappen = gebruikersList.map(g => ({
          ...g,
          totaalStappen: stappenPerUid[g.id] ?? 0,
        }))
        setGebruikers(gebruikersMetStappen)

        // Teams verrijken met leden en stappen
        const teamsList = teamsSnap.docs.map(teamDoc => {
          const team = { id: teamDoc.id, ...teamDoc.data() }
          const leden = gebruikersMetStappen.filter(g => g.teamId === team.id)
          const totaal = leden.reduce((sum, l) => sum + l.totaalStappen, 0)
          return {
            ...team,
            leden,
            aantalLeden: leden.length,
            totaalStappen: totaal,
          }
        })
        teamsList.sort((a, b) => b.totaalStappen - a.totaalStappen)
        setTeams(teamsList)

        // Challenge status
        if (challengeSnap.exists()) {
          setChallengeStatus(challengeSnap.data())
        }
      } catch {
        setFout('Kon data niet laden.')
      } finally {
        setLaden(false)
      }
    }
    laadData()
  }, [])

  async function handleRolWijzigen(uid, nieuweRol) {
    try {
      await updateDoc(doc(db, 'users', uid), { role: nieuweRol })
      setGebruikers(prev =>
        prev.map(g => g.id === uid ? { ...g, role: nieuweRol } : g)
      )
    } catch {
      setFout('Rol wijzigen mislukt.')
    }
  }

  async function handleChallengeToggle() {
    setChallengeLaden(true)
    try {
      const actief = challengeStatus?.actief ?? false
      const nieuweStatus = {
        actief: !actief,
        gewijzigdOp: new Date().toISOString(),
        gewijzigdDoor: user.uid,
        ...(!actief ? { gestart: new Date().toISOString() } : { beeindigd: new Date().toISOString() }),
      }
      await setDoc(doc(db, 'instellingen', 'challenge'), nieuweStatus)
      setChallengeStatus(nieuweStatus)
    } catch {
      setFout('Challenge status wijzigen mislukt.')
    } finally {
      setChallengeLaden(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const gefilterd = gebruikers.filter(
    g =>
      g.naam?.toLowerCase().includes(zoek.toLowerCase()) ||
      g.email?.toLowerCase().includes(zoek.toLowerCase())
  )

  const aantalDeelnemers = gebruikers.filter(g => g.role === 'deelnemer').length
  const aantalAdmins = gebruikers.filter(g => g.role === 'admin').length
  const aantalMetTeam = gebruikers.filter(g => g.teamId).length
  const meestActief = [...gebruikers].sort((a, b) => b.totaalStappen - a.totaalStappen)[0]
  const besteTeam = teams[0]
  const challengeActief = challengeStatus?.actief ?? false

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
            onClick={() => navigate('/dashboard')}
            className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5"
          >
            Dashboard
          </button>
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
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Admin panel</h1>
          <p className="text-white/30 text-sm mt-2">
            Ingelogd als <span className="text-white/50">{user?.naam}</span>
          </p>
        </div>

        {fout && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {fout}
          </div>
        )}

        {/* Challenge beheer */}
        <div className={`rounded-2xl p-6 border flex items-center justify-between gap-4 transition-colors
          ${challengeActief
            ? 'bg-[#84cc16]/[0.06] border-[#84cc16]/30'
            : 'bg-white/[0.03] border-white/5'
          }`}
        >
          <div>
            <h2 className="text-white font-bold">Challenge status</h2>
            <p className="text-white/30 text-sm mt-0.5">
              {laden ? '…' : challengeActief
                ? `Actief sinds ${new Date(challengeStatus.gestart).toLocaleDateString('nl-NL')}`
                : challengeStatus?.beeindigd
                  ? `Beëindigd op ${new Date(challengeStatus.beeindigd).toLocaleDateString('nl-NL')}`
                  : 'Challenge is nog niet gestart'
              }
            </p>
          </div>
          <button
            onClick={handleChallengeToggle}
            disabled={challengeLaden || laden}
            className={`text-sm font-bold rounded-xl px-5 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2
              ${challengeActief
                ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
                : 'bg-[#84cc16] hover:bg-[#95d926] text-[#0a0a0a]'
              }`}
          >
            {challengeLaden && (
              <span className={`w-4 h-4 border-2 rounded-full animate-spin
                ${challengeActief ? 'border-red-400/20 border-t-red-400' : 'border-black/20 border-t-black/70'}`}
              />
            )}
            {challengeActief ? 'Challenge beëindigen' : 'Challenge starten'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Deelnemers', value: laden ? '…' : aantalDeelnemers },
            { label: 'Admins', value: laden ? '…' : aantalAdmins },
            { label: 'In een team', value: laden ? '…' : aantalMetTeam },
            { label: 'Teams', value: laden ? '…' : teams.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-white/30 text-xs uppercase tracking-widest">{label}</span>
              <span className="text-white text-3xl font-black leading-none">{value}</span>
            </div>
          ))}
        </div>

        {/* Uitlichting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Meest actieve deelnemer */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-2">
            <p className="text-white/30 text-xs uppercase tracking-widest">Meest actief</p>
            {laden ? (
              <p className="text-white/20 text-sm">Laden…</p>
            ) : meestActief ? (
              <>
                <p className="text-white font-bold text-lg">{meestActief.naam || meestActief.email}</p>
                <p className="text-[#84cc16] text-sm font-black">
                  {meestActief.totaalStappen.toLocaleString('nl-NL')} stappen
                </p>
                <p className="text-white/20 text-xs">{meestActief.email}</p>
              </>
            ) : (
              <p className="text-white/20 text-sm">Nog geen data</p>
            )}
          </div>

          {/* Beste team */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-2">
            <p className="text-white/30 text-xs uppercase tracking-widest">Beste team</p>
            {laden ? (
              <p className="text-white/20 text-sm">Laden…</p>
            ) : besteTeam ? (
              <>
                <p className="text-white font-bold text-lg">{besteTeam.naam}</p>
                <p className="text-[#84cc16] text-sm font-black">
                  {besteTeam.totaalStappen.toLocaleString('nl-NL')} stappen
                </p>
                <p className="text-white/20 text-xs">{besteTeam.aantalLeden} leden</p>
              </>
            ) : (
              <p className="text-white/20 text-sm">Nog geen teams</p>
            )}
          </div>
        </div>

        {/* Teams overzicht */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-white font-bold">Teams</h2>
          </div>
          {laden ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-white/10 border-t-[#84cc16] rounded-full animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-12">Nog geen teams aangemaakt.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {teams.map((team, index) => (
                <div key={team.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-white/20 text-sm font-bold w-5 text-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{team.naam}</p>
                      <p className="text-white/30 text-xs">{team.aantalLeden} leden · code: {team.joinCode}</p>
                    </div>
                  </div>
                  <p className="text-[#84cc16] text-sm font-black shrink-0">
                    {team.totaalStappen.toLocaleString('nl-NL')}
                  </p>
                </div>
              ))}
            </div>
          )}
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
                    <p className="text-white/20 text-xs mt-0.5">
                      {g.totaalStappen?.toLocaleString('nl-NL') ?? 0} stappen totaal
                      {g.teamId && ` · team: ${g.teamId}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded border ${
                      g.role === 'admin'
                        ? 'text-[#84cc16] border-[#84cc16]/30 bg-[#84cc16]/5'
                        : 'text-white/40 border-white/10'
                    }`}>
                      {g.role || 'deelnemer'}
                    </span>
                    {g.id !== user?.uid && (
                      <button
                        onClick={() => handleRolWijzigen(g.id, g.role === 'admin' ? 'deelnemer' : 'admin')}
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