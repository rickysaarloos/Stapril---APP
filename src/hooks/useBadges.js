import { useEffect, useState } from 'react'
import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

// Alle badges die de app kent
export const ALLE_BADGES = [
  {
    id: 'eerste_stap',
    naam: 'Eerste stap',
    beschrijving: 'Eerste keer stappen invoeren',
    icoon: '👟',
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
  const DOEL = 10000
  const verdiend = new Set()
  const waarden = Object.values(stepsMap)

  // Eerste stap — er is minstens één invoer
  if (waarden.length > 0) verdiend.add('eerste_stap')

  // Dagdoel — minstens één dag >= 10.000
  if (waarden.some((s) => s >= DOEL)) verdiend.add('dagdoel')

  // Halve maand — 15+ doeldagen
  const doelDagen = waarden.filter((s) => s >= DOEL).length
  if (doelDagen >= 15) verdiend.add('halve_maand')

  // Volmaakte april — 30 doeldagen
  if (doelDagen >= 30) verdiend.add('volmaakte_april')

  // Week op rij — 7 opeenvolgende doeldagen
  const datums = Object.keys(stepsMap).sort()
  let reeks = 0
  for (let i = 0; i < datums.length; i++) {
    if (stepsMap[datums[i]] >= DOEL) {
      reeks++
      if (reeks >= 7) { verdiend.add('week_op_rij'); break }
    } else {
      reeks = 0
    }
  }

  return verdiend
}

// Kent een badge toe in Firestore — alleen als die nog niet bestaat (geen dubbele toekenning)
async function kenBadgeToe(uid, badgeId) {
  const ref = doc(db, 'users', uid, 'badges', badgeId)
  const snap = await getDoc(ref)
  if (snap.exists()) return false // al verdiend, overslaan

  await setDoc(ref, {
    badgeId,
    verdiendOp: serverTimestamp(),
  })
  return true // nieuw verdiend
}

// Verwerkt alle badges na een stappen-update
export async function verwerkBadges(uid, stepsMap) {
  const verdiend = berekenVerdiendeBadges(stepsMap)
  const nieuw = []

  for (const badgeId of verdiend) {
    const isNieuw = await kenBadgeToe(uid, badgeId)
    if (isNieuw) nieuw.push(badgeId)
  }

  return nieuw // geeft terug welke badges nét verdiend zijn (voor animatie)
}

// Hook — laadt verdiende badges realtime uit Firestore
export function useBadges(uid) {
  const [verdiendeBadges, setVerdiendeBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return

    async function laad() {
      const snap = await getDocs(collection(db, 'users', uid, 'badges'))
      const badges = {}
      snap.forEach((d) => {
        badges[d.id] = d.data()
      })
      setVerdiendeBadges(badges)
      setLoading(false)
    }

    laad()
  }, [uid])

  return { verdiendeBadges, loading }
}