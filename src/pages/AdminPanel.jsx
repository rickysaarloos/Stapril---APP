import { useState, useEffect } from 'react' // React hooks voor state en lifecycle
import { useNavigate } from 'react-router-dom' // Hook voor navigeren tussen routes
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore' // Firestore functies voor CRUD
import { db } from '../firebase' // Firebase database instantie
import { useAuthContext } from '../context/AuthContext' // Eigen hook voor auth context

export default function AdminPanel() {
  const { user, logout } = useAuthContext() // Haal huidige gebruiker en logout functie op
  const navigate = useNavigate() // Navigatie functie

  const [gebruikers, setGebruikers] = useState([]) // State voor alle gebruikers
  const [teams, setTeams] = useState([]) // State voor alle teams
  const [challengeStatus, setChallengeStatus] = useState(null) // State voor challenge info
  const [laden, setLaden] = useState(true) // Loading state voor data
  const [challengeLaden, setChallengeLaden] = useState(false) // Loading state specifiek voor challenge toggle
  const [fout, setFout] = useState('') // Foutmelding state
  const [zoek, setZoek] = useState('') // Zoekveld state

  // useEffect om data te laden bij component mount
  useEffect(() => {
    async function laadData() {
      try {
        // Haal parallel gebruikers, teams, stappen en challenge document op
        const [gebruikersSnap, teamsSnap, stappenSnap, challengeSnap] = await Promise.all([
          getDocs(collection(db, 'users')), // alle gebruikers
          getDocs(collection(db, 'teams')), // alle teams
          getDocs(collection(db, 'stappen')), // alle stappen
          getDoc(doc(db, 'instellingen', 'challenge')), // challenge instellingen
        ])

        // Map users snapshot naar array van objecten
        const gebruikersList = gebruikersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const stappen = stappenSnap.docs.map(d => d.data()) // alle stappen data
        const vandaag = new Date().toISOString().split('T')[0] // huidige datum in YYYY-MM-DD

        // Bereken totaal stappen en stappen vandaag per gebruiker
        const stappenPerUid = {}
        const stappenVandaagPerUid = {}
        stappen.forEach(s => {
          stappenPerUid[s.uid] = (stappenPerUid[s.uid] ?? 0) + (s.stappen ?? 0) // totaal stappen per uid
          if (s.datum === vandaag) { // als datum vandaag
            stappenVandaagPerUid[s.uid] = s.stappen ?? 0 // stappen vandaag per uid
          }
        })

        // Voeg totaal en vandaag info toe aan gebruikers
        const gebruikersMetStappen = gebruikersList.map(g => ({
          ...g,
          totaalStappen: stappenPerUid[g.id] ?? 0,
          stappenVandaag: stappenVandaagPerUid[g.id] ?? 0,
        }))
        setGebruikers(gebruikersMetStappen) // update state

        // Bereken teams info: leden, aantalLeden, totaalStappen
        const teamsList = teamsSnap.docs.map(teamDoc => {
          const team = { id: teamDoc.id, ...teamDoc.data() }
          const leden = gebruikersMetStappen.filter(g => g.teamId === team.id) // leden van dit team
          const totaal = leden.reduce((sum, l) => sum + l.totaalStappen, 0) // totaal stappen team
          return {
            ...team,
            leden,
            aantalLeden: leden.length,
            totaalStappen: totaal,
          }
        })
        teamsList.sort((a, b) => b.totaalStappen - a.totaalStappen) // sorteert teams op totaal stappen
        setTeams(teamsList) // update state

        if (challengeSnap.exists()) { // als challenge document bestaat
          setChallengeStatus(challengeSnap.data()) // update challenge status
        }
      } catch {
        setFout('Kon data niet laden.') // foutmelding bij ophalen
      } finally {
        setLaden(false) // data laden klaar
      }
    }
    laadData() // roep functie aan
  }, [])

  // Functie om rol van gebruiker te wijzigen
  async function handleRolWijzigen(uid, nieuweRol) {
    try {
      await updateDoc(doc(db, 'users', uid), { role: nieuweRol }) // update Firestore
      setGebruikers(prev =>
        prev.map(g => g.id === uid ? { ...g, role: nieuweRol } : g) // update lokale state
      )
    } catch {
      setFout('Rol wijzigen mislukt.') // foutmelding
    }
  }

  // Toggle challenge actief/inactief
  async function handleChallengeToggle() {
    setChallengeLaden(true) // laad indicator aan
    try {
      const actief = challengeStatus?.actief ?? false // huidige status
      const nieuweStatus = { // nieuw object
        actief: !actief, // toggle
        gewijzigdOp: new Date().toISOString(), // tijdstip wijziging
        gewijzigdDoor: user.uid, // wie wijzigde
        ...(!actief
          ? { gestart: new Date().toISOString() } // als gestart, zet gestart tijd
          : { beeindigd: new Date().toISOString() } // anders eindtijd
        ),
      }
      await setDoc(doc(db, 'instellingen', 'challenge'), nieuweStatus) // update Firestore
      setChallengeStatus(nieuweStatus) // update state
    } catch {
      setFout('Challenge status wijzigen mislukt.') // foutmelding
    } finally {
      setChallengeLaden(false) // laad indicator uit
    }
  }

  // Exporteer gebruikers naar CSV
  function handleExport() {
    const rijen = [
      ['Naam', 'Email', 'Rol', 'Team', 'Stappen vandaag', 'Totaal stappen'], // header
      ...gebruikers.map(g => [
        g.naam ?? '',
        g.email ?? '',
        g.role ?? 'deelnemer',
        g.teamId ?? '',
        g.stappenVandaag ?? 0,
        g.totaalStappen ?? 0,
      ])
    ]
    const csv = rijen.map(r => r.join(',')).join('\n') // maak CSV string
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }) // Blob voor download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stapril_export_${new Date().toISOString().split('T')[0]}.csv` // bestandsnaam
    link.click() // trigger download
    URL.revokeObjectURL(url) // clean-up
  }

  // Logout functie
  async function handleLogout() {
    await logout() // gebruik auth context
    navigate('/login') // ga naar login pagina
  }

  // Filter gebruikers op zoekterm
  const gefilterd = gebruikers.filter(
    g =>
      g.naam?.toLowerCase().includes(zoek.toLowerCase()) ||
      g.email?.toLowerCase().includes(zoek.toLowerCase())
  )

  // Berekeningen voor stats
  const aantalDeelnemers = gebruikers.filter(g => g.role === 'deelnemer').length // deelnemers
  const aantalAdmins = gebruikers.filter(g => g.role === 'admin').length // admins
  const aantalMetTeam = gebruikers.filter(g => g.teamId).length // gebruikers in team
  const meestActief = [...gebruikers].sort((a, b) => b.totaalStappen - a.totaalStappen)[0] // top gebruiker
  const besteTeam = teams[0] // top team
  const challengeActief = challengeStatus?.actief ?? false // huidige challenge status

  // Bereken percentage dagdoel vandaag
  const actieveDeelnemers = gebruikers.filter(g => g.role === 'deelnemer') // alleen deelnemers
  const dagdoelVandaag = actieveDeelnemers.filter(g => g.stappenVandaag >= 10000) // gehaald dagdoel
  const percentageDagdoel = actieveDeelnemers.length > 0
    ? Math.round((dagdoelVandaag.length / actieveDeelnemers.length) * 100)
    : 0

  // JSX return
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ... hier volgt alle UI JSX, al die Tailwind markup bouwt het admin panel */}
    </div>
  )
}