import { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase'

export function useKlassement() {
  const [klassement, setKlassement] = useState([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    let teamsData = []
    let stappenData = []

    function bereken() {
      const teams = teamsData.map(team => {
        const leden = team.leden ?? []
        const teamStappen = stappenData.filter(s => leden.includes(s.uid))
        const totaal = teamStappen.reduce((sum, s) => sum + (s.stappen ?? 0), 0)
        const aantalLeden = leden.length
        const uniekeDagen = new Set(teamStappen.map(s => s.datum)).size
        const gemiddeld = aantalLeden > 0 && uniekeDagen > 0
          ? Math.round(totaal / aantalLeden / uniekeDagen)
          : 0

        return {
          id: team.id,
          naam: team.naam,
          aantalLeden,
          totaalStappen: totaal,
          gemiddeldPerPersoonPerDag: gemiddeld,
        }
      })

      teams.sort((a, b) => b.totaalStappen - a.totaalStappen)
      setKlassement(teams)
      setLaden(false)
    }

    const unsubTeams = onSnapshot(
      query(collection(db, 'teams')),
      snap => {
        teamsData = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        bereken()
      }
    )

    const unsubStappen = onSnapshot(
      query(collection(db, 'stappen')),
      snap => {
        stappenData = snap.docs.map(d => d.data())
        bereken()
      }
    )

    return () => {
      unsubTeams()
      unsubStappen()
    }
  }, [])

  return { klassement, laden }
}