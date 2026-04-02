import { useEffect, useState } from 'react' // React hooks voor state en lifecycle
import { collection, query, where, getDocs } from 'firebase/firestore' // Firestore functies
import { db } from '../firebase' // Jouw Firestore database instance

const DAGDOEL = 10000 // Stappen doel per dag

// Functie om de huidige streak (aantal opeenvolgende dagen met dagdoel) te berekenen
function berekenStreak(datums) {
  if (!datums.length) return 0 // Geen datums → streak 0

  const gesorteerd = [...datums].sort((a, b) => b.localeCompare(a)) // Sorteer datums van nieuw naar oud

  let streak = 0 // Teller voor streak
  let verwacht = new Date() // Start vandaag
  verwacht.setHours(0, 0, 0, 0) // Zet tijd op 00:00 voor vergelijking

  for (const datum of gesorteerd) {
    const dag = new Date(datum + 'T00:00:00') // Converteer datum string naar Date object
    const verschil = Math.round((verwacht - dag) / (1000 * 60 * 60 * 24)) // Verschil in dagen

    if (verschil === 0 || verschil === 1) { // Dag is vandaag of gisteren in de reeks
      streak++ // Verhoog streak
      verwacht = dag // Update volgende verwachte dag
    } else {
      break // Onderbroken streak → stop
    }
  }

  return streak
}

// Custom hook voor statistieken van een gebruiker
export function useStats(uid, refresh = 0) {
  const [stats, setStats] = useState({
    totaalStappen: 0, // Totaal aantal stappen
    doelDagen: 0,     // Aantal dagen dat dagdoel gehaald
    streak: 0,        // Huidige streak
    laden: true,      // Loading state
  })

  useEffect(() => {
    if (!uid) return // Stop als geen gebruiker

    async function bereken() { // Functie om stats te berekenen
      try {
        const q = query(collection(db, 'stappen'), where('uid', '==', uid)) // Query voor stappen van deze gebruiker
        const snap = await getDocs(q) // Haal documenten op

        let totaal = 0 // Totaal stappen teller
        let doelDagen = 0 // Teller voor dagen dat dagdoel gehaald
        const doelDatums = [] // Lijst van datums waarop dagdoel gehaald

        snap.forEach((doc) => {
          const { stappen, datum } = doc.data() // Haal stappen en datum
          totaal += stappen // Tel op bij totaal
          if (stappen >= DAGDOEL) { // Als dagdoel gehaald
            doelDagen++ // Verhoog teller
            doelDatums.push(datum) // Voeg datum toe
          }
        })

        setStats({
          totaalStappen: totaal, // Update totaal
          doelDagen,             // Update aantal doel dagen
          streak: berekenStreak(doelDatums), // Bereken streak
          laden: false,          // Laden klaar
        })
      } catch (e) {
        console.error(e) // Log eventuele fouten
        setStats(s => ({ ...s, laden: false })) // Stop loading bij fout
      }
    }

    bereken() // Voer berekening uit
  }, [uid, refresh]) // Herbereken als uid of refresh verandert

  return stats // Retourneer statistieken
}