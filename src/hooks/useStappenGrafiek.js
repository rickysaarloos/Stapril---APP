import { useEffect, useState } from 'react' // React hooks voor state en lifecycle
import { collection, query, where, getDocs } from 'firebase/firestore' // Firestore functies
import { db } from '../firebase' // Jouw Firestore database instance

export function useStappenGrafiek(uid, refresh = 0) { // Custom hook voor stappen grafiek
  const [data, setData] = useState([]) // State voor grafiekdata per dag
  const [laden, setLaden] = useState(true) // Loading state

  useEffect(() => { // Hook die wordt uitgevoerd bij mount of bij veranderingen in uid/refresh
    if (!uid) return // Stop als geen gebruiker

    async function laad() { // Functie om stappen op te halen
      try {
        const q = query(collection(db, 'stappen'), where('uid', '==', uid)) // Query naar stappen van deze user
        const snap = await getDocs(q) // Haal documenten op

        const map = {} // Maak map datum → stappen
        snap.forEach(doc => {
          const { datum, stappen } = doc.data() // Haal datum en stappen op
          map[datum] = stappen // Sla op in map
        })

        const nu = new Date()
        const jaar = nu.getFullYear()
        const maand = nu.getMonth() // Maand (0-11)
        const aantalDagen = new Date(jaar, maand + 1, 0).getDate() // Aantal dagen in deze maand

        // Maak array van alle dagen van de maand
        const dagen = Array.from({ length: aantalDagen }, (_, i) => {
          const dag = i + 1
          const datum = `${jaar}-${String(maand + 1).padStart(2, '0')}-${String(dag).padStart(2, '0')}` // Formatteer datum
          return {
            dag, // Dagnummer
            datum, // Datum string
            stappen: map[datum] ?? null, // Stappen of null als niet ingevoerd
          }
        })

        setData(dagen) // Update state met alle dagen
      } catch (e) {
        console.error(e) // Log eventuele fouten
      } finally {
        setLaden(false) // Laden klaar
      }
    }

    laad() // Voer de laadfunctie uit
  }, [uid, refresh]) // Herlaad als uid of refresh verandert

  return { data, laden } // Geef data en loading state terug
}