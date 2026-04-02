import { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook die teamklassement en laadstatus realtime bijhoudt via Firestore listeners.
 * @returns {{klassement:Array, laden:boolean}}
 */
export function useKlassement() {
  const [klassement, setKlassement] = useState([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    // Listener op teams
    const teamsQuery = query(collection(db, 'teams'))
    const unsubTeams = onSnapshot(teamsQuery, async (teamsSnap) => {

      // Listener op stappen
      const stappenQuery = query(collection(db, 'stappen'))
      const unsubStappen = onSnapshot(stappenQuery, (stappenSnap) => {
        const stappen = stappenSnap.docs.map(d => d.data())

        const teams = teamsSnap.docs.map(teamDoc => {
          const team = { id: teamDoc.id, ...teamDoc.data() }

          // Stappen van dit team
          const teamStappen = stappen.filter(s => {
            // uid koppelen aan teamleden — via leden array in team doc
            return team.leden?.includes(s.uid)
          })

          const totaal = teamStappen.reduce((sum, s) => sum + (s.stappen ?? 0), 0)
          const aantalLeden = team.leden?.length ?? 0

          // Unieke dagen per lid
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

        // Sorteren op totale stappen
        teams.sort((a, b) => b.totaalStappen - a.totaalStappen)
        setKlassement(teams)
        setLaden(false)
      })

      // Cleanup stappen listener
      return () => unsubStappen()
    })

    // Cleanup teams listener
    return () => unsubTeams()
  }, [])

    return { klassement, laden }
}