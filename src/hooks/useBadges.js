import { useEffect, useState } from 'react' // React hooks voor state en lifecycle
import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp // Firestore functies
} from 'firebase/firestore'
import { db } from '../firebase' // Jouw Firestore database instance

// Alle badges die de app kent
export const ALLE_BADGES = [ // Lijst met alle mogelijke badges
  {
    id: 'eerste_stap', // Unieke ID van badge
    naam: 'Eerste stap', // Naam van badge
    beschrijving: 'Eerste keer stappen invoeren', // Uitleg
    icoon: '👟', // Emoji icoon
  },
  {
    id: 'dagdoel',
    naam: 'Dagdoel gehaald',
    beschrijving: '10.000+ stappen op één dag',
    icoon: '🎯',
  },
  {
    id: 'week_op_rij',
    naam: 'Week op rij',
    beschrijving: '7 dagen achter elkaar het dagdoel gehaald',
    icoon: '🔥',
  },
  {
    id: 'halve_maand',
    naam: 'Halve maand',
    beschrijving: '15 dagen het dagdoel gehaald in april',
    icoon: '🌗',
  },
  {
    id: 'volmaakte_april',
    naam: 'Volmaakte april',
    beschrijving: 'Alle 30 dagen het dagdoel gehaald',
    icoon: '🏆',
  },
]

// Controleert welke badges verdiend zijn op basis van de stappendata
function berekenVerdiendeBadges(stepsMap) {
  const DOEL = 10000 // Dagdoel
  const verdiend = new Set() // Set om dubbele badges te voorkomen
  const waarden = Object.values(stepsMap) // Alle stappenwaarden

  // Eerste stap — er is minstens één invoer
  if (waarden.length > 0) verdiend.add('eerste_stap') // Minstens 1 dag ingevuld

  // Dagdoel — minstens één dag >= 10.000
  if (waarden.some((s) => s >= DOEL)) verdiend.add('dagdoel') // Check of doel ooit gehaald is

  // Halve maand — 15+ doeldagen
  const doelDagen = waarden.filter((s) => s >= DOEL).length // Aantal dagen met ≥10k
  if (doelDagen >= 15) verdiend.add('halve_maand') // 15+ dagen gehaald

  // Volmaakte april — 30 doeldagen
  if (doelDagen >= 30) verdiend.add('volmaakte_april') // Alle dagen gehaald

  // Week op rij — 7 opeenvolgende doeldagen
  const datums = Object.keys(stepsMap).sort() // Sorteer datums
  let reeks = 0 // Teller voor opeenvolgende dagen

  for (let i = 0; i < datums.length; i++) { // Loop door alle dagen
    if (stepsMap[datums[i]] >= DOEL) { // Als dagdoel gehaald
      reeks++ // Verhoog reeks
      if (reeks >= 7) { 
        verdiend.add('week_op_rij') // Badge verdiend
        break // Stop loop
      }
    } else {
      reeks = 0 // Reset reeks als doel niet gehaald
    }
  }

  return verdiend // Geeft alle verdiende badges terug
}

// Kent een badge toe in Firestore — alleen als die nog niet bestaat (geen dubbele toekenning)
async function kenBadgeToe(uid, badgeId) {
  const ref = doc(db, 'users', uid, 'badges', badgeId) // Referentie naar badge document
  const snap = await getDoc(ref) // Check of badge al bestaat

  if (snap.exists()) return false // Als al bestaat → niets doen

  await setDoc(ref, {
    badgeId, // Badge ID opslaan
    verdiendOp: serverTimestamp(), // Tijdstip van behalen (server-side)
  })

  return true // Badge is nieuw toegekend
}

// Verwerkt alle badges na een stappen-update
export async function verwerkBadges(uid, stepsMap) {
  const verdiend = berekenVerdiendeBadges(stepsMap) // Bereken welke badges behaald zijn
  const nieuw = [] // Lijst van nieuwe badges

  for (const badgeId of verdiend) { // Loop door alle verdiende badges
    const isNieuw = await kenBadgeToe(uid, badgeId) // Probeer toe te kennen
    if (isNieuw) nieuw.push(badgeId) // Voeg toe als nieuw
  }

  return nieuw // Retourneert alleen nieuwe badges (handig voor animaties/UI)
}

// Hook — laadt verdiende badges realtime uit Firestore
export function useBadges(uid) {
  const [verdiendeBadges, setVerdiendeBadges] = useState([]) // State voor badges
  const [loading, setLoading] = useState(true) // Loading state

  useEffect(() => {
    if (!uid) return // Stop als geen gebruiker

    async function laad() { // Functie om badges te laden
      const snap = await getDocs(collection(db, 'users', uid, 'badges')) // Haal alle badges op
      const badges = {} // Object om badges in op te slaan

      snap.forEach((d) => { // Loop door alle documenten
        badges[d.id] = d.data() // Sla badge op met ID als key
      })

      setVerdiendeBadges(badges) // Zet state
      setLoading(false) // Laden klaar
    }

    laad() // Voer functie uit
  }, [uid]) // Opnieuw laden als uid verandert

  return { verdiendeBadges, loading } // Geef badges en loading terug
}