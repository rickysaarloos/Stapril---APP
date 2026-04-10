import { useEffect, useState } from 'react'
import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Beschrijft alle beschikbare badges in de applicatie.
 * @type {{id:string,naam:string,beschrijving:string,icoon:string,categorie:string}[]}
 */
export const ALLE_BADGES = [
  // ── Eerste stappen ──────────────────────────────────────────────
  {
    id: 'eerste_stap',
    naam: 'Eerste stap',
    beschrijving: 'Voor het eerst stappen invoeren',
    icoon: '👟',
    categorie: 'begin',
  },
  {
    id: 'dagdoel',
    naam: 'Dagdoel gehaald',
    beschrijving: 'Jouw persoonlijke dagdoel halen',
    icoon: '🎯',
    categorie: 'begin',
  },

  // ── Afstand & volume ─────────────────────────────────────────────
  {
    id: 'halve_marathon',
    naam: 'Halve marathon',
    beschrijving: '21.000+ stappen op één dag',
    icoon: '🥈',
    categorie: 'afstand',
  },
  {
    id: 'marathonloper',
    naam: 'Marathonloper',
    beschrijving: '42.000+ stappen op één dag — een hele marathon!',
    icoon: '🏅',
    categorie: 'afstand',
  },
  {
    id: 'stappenreus',
    naam: 'Stappenreus',
    beschrijving: '250.000+ totale stappen in april',
    icoon: '🦕',
    categorie: 'afstand',
  },
  {
    id: 'miljoenair',
    naam: 'Stappenmiljoenair',
    beschrijving: '1.000.000+ totale stappen in april',
    icoon: '💎',
    categorie: 'afstand',
  },

  // ── Streaks & consistentie ───────────────────────────────────────
  {
    id: 'drie_op_rij',
    naam: 'Op dreef',
    beschrijving: '3 dagen achter elkaar het dagdoel gehaald',
    icoon: '⚡',
    categorie: 'streak',
  },
  {
    id: 'week_op_rij',
    naam: 'Week op rij',
    beschrijving: '7 dagen achter elkaar het dagdoel gehaald',
    icoon: '🔥',
    categorie: 'streak',
  },
  {
    id: 'twee_weken',
    naam: 'IJzeren wil',
    beschrijving: '14 dagen achter elkaar het dagdoel gehaald',
    icoon: '🧲',
    categorie: 'streak',
  },
  {
    id: 'comeback_kid',
    naam: 'Comeback kid',
    beschrijving: 'Na een gemiste dag direct weer het dagdoel halen',
    icoon: '💪',
    categorie: 'streak',
  },
  {
    id: 'weekend_warrior',
    naam: 'Weekend warrior',
    beschrijving: 'Zaterdag én zondag allebei het dagdoel halen',
    icoon: '🏖️',
    categorie: 'streak',
  },
  {
    id: 'vroege_vogel',
    naam: 'Vroege vogel',
    beschrijving: '3 maandagen op rij het dagdoel halen',
    icoon: '🐦',
    categorie: 'streak',
  },

  // ── Mijlpalen (totaal) ────────────────────────────────────────────
  {
    id: 'halve_maand',
    naam: 'Halve maand',
    beschrijving: '15 dagen het dagdoel gehaald in april',
    icoon: '🌗',
    categorie: 'mijlpaal',
  },
  {
    id: 'volmaakte_april',
    naam: 'Volmaakte april',
    beschrijving: 'Alle 30 dagen het dagdoel gehaald',
    icoon: '🏆',
    categorie: 'mijlpaal',
  },

  // ── Sociaal & team ────────────────────────────────────────────────
  {
    id: 'teamspeler',
    naam: 'Teamspeler',
    beschrijving: 'Lid worden van een team',
    icoon: '🤝',
    categorie: 'sociaal',
  },

  // ── App ontdekken ─────────────────────────────────────────────────
  {
    id: 'naamgever',
    naam: 'Naamgever',
    beschrijving: 'Je gebruikersnaam instellen of wijzigen',
    icoon: '✏️',
    categorie: 'ontdekken',
  },
  {
    id: 'fotograaf',
    naam: 'Fotograaf',
    beschrijving: 'Een profielfoto instellen',
    icoon: '📸',
    categorie: 'ontdekken',
  },
  {
    id: 'badgejager',
    naam: 'Badgejager',
    beschrijving: '5 of meer badges verzamelen',
    icoon: '🎖️',
    categorie: 'ontdekken',
  },
  {
    id: 'verzamelaar',
    naam: 'Verzamelaar',
    beschrijving: 'Alle badges behalen: de ultieme uitdaging.',
    icoon: '🌟',
    categorie: 'ontdekken',
  },
]

const DEFAULT_DAGDOEL = 10000

// ─────────────────────────────────────────────────────────────────────────────
// Hulpfuncties
// ─────────────────────────────────────────────────────────────────────────────

/** Geeft de dag van de week (0 = zo, 1 = ma, ..., 6 = za) voor een datum-string 'YYYY-MM-DD'. */
function dagVanWeek(datumStr) {
  return new Date(datumStr + 'T12:00:00').getDay()
}

/**
 * Berekent welke badges een gebruiker heeft verdiend op basis van stappen per datum
 * én extra profieldata.
 *
 * @param {{[datum:string]: number}} stepsMap   Stappen per datum ('YYYY-MM-DD')
 * @param {{heeftTeam?: boolean, heeftFoto?: boolean, heeftNaam?: boolean, aantalBadges?: number, dagdoel?: number}} profiel
 * @returns {Set<string>} Set met verdiende badge IDs
 */
function berekenVerdiendeBadges(stepsMap, profiel = {}) {
  const DOEL = profiel.dagdoel ?? DEFAULT_DAGDOEL
  const verdiend = new Set()
  const waarden = Object.values(stepsMap)
  const datums = Object.keys(stepsMap).sort()

  // ── Begin ────────────────────────────────────────────────────────
  if (waarden.length > 0) verdiend.add('eerste_stap')
  if (waarden.some(s => s >= DOEL)) verdiend.add('dagdoel')

  // ── Afstand & volume ─────────────────────────────────────────────
  if (waarden.some(s => s >= 21000)) verdiend.add('halve_marathon')
  if (waarden.some(s => s >= 42000)) verdiend.add('marathonloper')

  const totaal = waarden.reduce((a, b) => a + b, 0)
  if (totaal >= 250000) verdiend.add('stappenreus')
  if (totaal >= 1_000_000) verdiend.add('miljoenair')

  // ── Streaks ──────────────────────────────────────────────────────
  let reeks = 0
  let maxReeks = 0
  for (let i = 0; i < datums.length; i++) {
    if (stepsMap[datums[i]] >= DOEL) {
      reeks++
      maxReeks = Math.max(maxReeks, reeks)
    } else {
      reeks = 0
    }
  }
  if (maxReeks >= 3) verdiend.add('drie_op_rij')
  if (maxReeks >= 7) verdiend.add('week_op_rij')
  if (maxReeks >= 14) verdiend.add('twee_weken')

  // Comeback kid — gemiste dag gevolgd door een dag met dagdoel
  for (let i = 1; i < datums.length; i++) {
    const gisteren = datums[i - 1]
    const vandaag = datums[i]
    const diff = (new Date(vandaag) - new Date(gisteren)) / 86400000
    if (diff === 1 && stepsMap[gisteren] < DOEL && stepsMap[vandaag] >= DOEL) {
      verdiend.add('comeback_kid')
      break
    }
  }

  // Weekend warrior — een zaterdag én zondag in dezelfde week
  const zaterdagen = datums.filter(d => dagVanWeek(d) === 6 && stepsMap[d] >= DOEL)
  const zondagen   = datums.filter(d => dagVanWeek(d) === 0 && stepsMap[d] >= DOEL)
  for (const zat of zaterdagen) {
    const heeftZondag = zondagen.some(zo => {
      const diff = (new Date(zo) - new Date(zat)) / 86400000
      return diff === 1
    })
    if (heeftZondag) { verdiend.add('weekend_warrior'); break }
  }

  // Vroege vogel — 3 maandagen op rij met dagdoel
  const maandagenMetDoel = datums.filter(d => dagVanWeek(d) === 1 && stepsMap[d] >= DOEL)
  let maReeks = 0
  for (let i = 1; i < maandagenMetDoel.length; i++) {
    const diff = (new Date(maandagenMetDoel[i]) - new Date(maandagenMetDoel[i - 1])) / 86400000
    if (diff === 7) {
      maReeks++
      if (maReeks >= 2) { verdiend.add('vroege_vogel'); break }
    } else {
      maReeks = 0
    }
  }

  // ── Mijlpalen ────────────────────────────────────────────────────
  const doelDagen = waarden.filter(s => s >= DOEL).length
  if (doelDagen >= 15) verdiend.add('halve_maand')
  if (doelDagen >= 30) verdiend.add('volmaakte_april')

  // ── Sociaal ──────────────────────────────────────────────────────
  if (profiel.heeftTeam) verdiend.add('teamspeler')

  // ── App ontdekken ────────────────────────────────────────────────
  if (profiel.heeftNaam) verdiend.add('naamgever')
  if (profiel.heeftFoto) verdiend.add('fotograaf')

  // Badgejager: tel huidig aantal + wat we nu net toekennen
  const totaalBadges = (profiel.aantalBadges ?? 0) + verdiend.size
  if (totaalBadges >= 5) verdiend.add('badgejager')

  // Verzamelaar: alle andere badges aanwezig?
  const alleExclVerzamelaar = ALLE_BADGES.filter(b => b.id !== 'verzamelaar')
  const heeftAlles = alleExclVerzamelaar.every(b => verdiend.has(b.id))
  if (heeftAlles) verdiend.add('verzamelaar')

  return verdiend
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kent een badge toe aan een gebruiker in Firestore, als deze niet al bestaat.
 * @param {string} uid
 * @param {string} badgeId
 * @returns {Promise<boolean>} true als nieuw verdiend
 */
async function kenBadgeToe(uid, badgeId) {
  const ref = doc(db, 'users', uid, 'badges', badgeId)
  const snap = await getDoc(ref)
  if (snap.exists()) return false
  await setDoc(ref, { badgeId, verdiendOp: serverTimestamp() })
  return true
}

/**
 * Verwerkt en schrijft nieuw verdiende badges weg in Firestore.
 * Laadt automatisch het persoonlijke dagdoel op uit users/{uid}.dagdoel.
 *
 * @param {string} uid
 * @param {{[datum:string]: number}} stepsMap
 * @param {{heeftTeam?: boolean, heeftFoto?: boolean, heeftNaam?: boolean}} profiel
 * @returns {Promise<string[]>} Lijst van nieuw toegekende badge IDs
 */
export async function verwerkBadges(uid, stepsMap, profiel = {}) {
  // Laad bestaande badges én persoonlijk dagdoel tegelijk op
  const [bestaandeSnap, userSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'badges')),
    getDoc(doc(db, 'users', uid)),
  ])

  const aantalBadges = bestaandeSnap.size
  const dagdoel = userSnap.data()?.dagdoel ?? DEFAULT_DAGDOEL

  const verdiend = berekenVerdiendeBadges(stepsMap, { ...profiel, aantalBadges, dagdoel })
  const nieuw = []

  for (const badgeId of verdiend) {
    const isNieuw = await kenBadgeToe(uid, badgeId)
    if (isNieuw) nieuw.push(badgeId)
  }

  return nieuw
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom hook die badges voor een gebruiker ophaalt uit Firestore.
 * @param {string|undefined} uid
 * @returns {{verdiendeBadges: Record<string, object>, loading: boolean}}
 */
export function useBadges(uid) {
  const [verdiendeBadges, setVerdiendeBadges] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return

    async function laad() {
      const snap = await getDocs(collection(db, 'users', uid, 'badges'))
      const badges = {}
      snap.forEach(d => { badges[d.id] = d.data() })
      setVerdiendeBadges(badges)
      setLoading(false)
    }

    laad()
  }, [uid])

  return { verdiendeBadges, loading }
}