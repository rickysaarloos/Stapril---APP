import { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase'
 
/**
 * Hook die teamklassement realtime bijhoudt via Firestore.
 * Stappen komen uit de `stappen` collectie {uid, datum, stappen}.
 * Teams komen uit de `teams` collectie {naam, leden: string[]}.
 * @returns {{klassement:Array, laden:boolean}}
 */
export function useKlassement() {
  const [klassement, setKlassement] = useState([])
  const [laden, setLaden] = useState(true)
 
  // Aparte state voor ruwe data zodat beide listeners onafhankelijk kunnen updaten
  const [teams, setTeams] = useState([])
  const [stappen, setStappen] = useState([])
  const [teamsLaden, setTeamsLaden] = useState(true)
  const [stappenLaden, setStappenLaden] = useState(true)
 
  // Listener op teams collectie
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'teams')), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTeamsLaden(false)
    }, (e) => {
      console.error('Teams listener fout:', e)
      setTeamsLaden(false)
    })
    return () => unsub()
  }, [])
 
  // Listener op stappen collectie
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'stappen')), (snap) => {
      setStappen(snap.docs.map(d => d.data()))
      setStappenLaden(false)
    }, (e) => {
      console.error('Stappen listener fout:', e)
      setStappenLaden(false)
    })
    return () => unsub()
  }, [])
 
  // Bereken klassement zodra beide datasets binnen zijn
  useEffect(() => {
    if (teamsLaden || stappenLaden) return
 
    const berekend = teams.map(team => {
      const leden = team.leden ?? []
 
      // Alle stap-docs van leden in dit team
      const teamStappen = stappen.filter(s => leden.includes(s.uid))
 
      const totaal = teamStappen.reduce((som, s) => som + (s.stappen ?? 0), 0)
      const aantalLeden = leden.length
 
      // Gemiddeld per persoon per dag (unieke dagen over alle leden)
      const uniekeDagen = new Set(teamStappen.map(s => s.datum)).size
      const gemiddeld = aantalLeden > 0 && uniekeDagen > 0
        ? Math.round(totaal / aantalLeden / uniekeDagen)
        : 0
 
      return {
        id: team.id,
        naam: team.naam ?? 'Onbekend team',
        aantalLeden,
        totaalStappen: totaal,
        gemiddeldPerPersoonPerDag: gemiddeld,
      }
    })
 
    berekend.sort((a, b) => b.totaalStappen - a.totaalStappen)
    setKlassement(berekend)
    setLaden(false)
  }, [teams, stappen, teamsLaden, stappenLaden])
 
  return { klassement, laden }
}