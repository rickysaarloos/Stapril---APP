import { useState, useEffect } from 'react' // React hooks voor state en lifecycle
import { collection, onSnapshot, query } from 'firebase/firestore' // Firestore functies
import { db } from '../firebase' // Jouw Firestore database instance

export function useKlassement() { // Custom hook voor klassement van teams
  const [klassement, setKlassement] = useState([]) // State voor het klassement
  const [laden, setLaden] = useState(true) // Loading state

  useEffect(() => { // Hook die bij mount wordt uitgevoerd
    let teamsData = [] // Houdt alle teamdocumenten bij
    let stappenData = [] // Houdt alle stappen bij

    function bereken() { // Functie om klassement te berekenen
      const teams = teamsData.map(team => { // Loop door alle teams
        const leden = team.leden ?? [] // Leden van het team of lege array
        const teamStappen = stappenData.filter(s => leden.includes(s.uid)) // Stappen van teamleden
        const totaal = teamStappen.reduce((sum, s) => sum + (s.stappen ?? 0), 0) // Totaal aantal stappen
        const aantalLeden = leden.length // Aantal leden in team
        const uniekeDagen = new Set(teamStappen.map(s => s.datum)).size // Aantal unieke dagen
        const gemiddeld = aantalLeden > 0 && uniekeDagen > 0 // Gemiddeld per persoon per dag
          ? Math.round(totaal / aantalLeden / uniekeDagen)
          : 0

        return { // Bouw object voor elk team
          id: team.id,
          naam: team.naam,
          aantalLeden,
          totaalStappen: totaal,
          gemiddeldPerPersoonPerDag: gemiddeld,
        }
      })

      teams.sort((a, b) => b.totaalStappen - a.totaalStappen) // Sorteer aflopend op totaal stappen
      setKlassement(teams) // Update state
      setLaden(false) // Loading klaar
    }

    // Luister realtime naar teams collectie
    const unsubTeams = onSnapshot(
      query(collection(db, 'teams')),
      snap => {
        teamsData = snap.docs.map(d => ({ id: d.id, ...d.data() })) // Sla teamdata op
        bereken() // Herbereken klassement
      }
    )

    // Luister realtime naar stappen collectie
    const unsubStappen = onSnapshot(
      query(collection(db, 'stappen')),
      snap => {
        stappenData = snap.docs.map(d => d.data()) // Sla stappen op
        bereken() // Herbereken klassement
      }
    )

    return () => { // Cleanup functie bij unmount
      unsubTeams() // Stop listener teams
      unsubStappen() // Stop listener stappen
    }
  }, []) // Dependency array leeg → alleen bij mount

  return { klassement, laden } // Geef klassement en loading state terug
}