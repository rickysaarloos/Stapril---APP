import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const DAGDOEL = 10000

/**
 * Berekent de huidige dagstreak op basis van volgorde van doel-dagen.
 * @param {string[]} datums Array met ISO-datumstrings waarop doel gehaald is
 * @returns {number} Aantal opeenvolgende dagen vanaf vandaag
 */
function berekenStreak(datums) {
  if (!datums.length) return 0

  const gesorteerd = [...datums].sort((a, b) => b.localeCompare(a))

  let streak = 0
  let verwacht = new Date()
  verwacht.setHours(0, 0, 0, 0)

  for (const datum of gesorteerd) {
    const dag = new Date(datum + 'T00:00:00')
    const verschil = Math.round((verwacht - dag) / (1000 * 60 * 60 * 24))

    if (verschil === 0 || verschil === 1) {
      streak++
      verwacht = dag
    } else {
      break
    }
  }

  return streak
}

/**
 * Hook met gebruikersstatistieken (totaal stappen, aantal doeldagen en streak).
 * @param {string} uid Gebruikers-ID
 * @param {number} [refresh=0] Triggert herladen van data
 * @returns {{totaalStappen:number, doelDagen:number, streak:number, laden:boolean}}
 */
export function useStats(uid, refresh = 0) {
  const [stats, setStats] = useState({
    totaalStappen: 0,
    doelDagen: 0,
    streak: 0,
    laden: true,
  })

  useEffect(() => {
    if (!uid) return

    async function bereken() {
      try {
        const q = query(collection(db, 'stappen'), where('uid', '==', uid))
        const snap = await getDocs(q)

        let totaal = 0
        let doelDagen = 0
        const doelDatums = []

        snap.forEach((doc) => {
          const { stappen, datum } = doc.data()
          totaal += stappen
          if (stappen >= DAGDOEL) {
            doelDagen++
            doelDatums.push(datum)
          }
        })

        setStats({
          totaalStappen: totaal,
          doelDagen,
          streak: berekenStreak(doelDatums),
          laden: false,
        })
      } catch (e) {
        console.error(e)
        setStats(s => ({ ...s, laden: false }))
      }
    }

    bereken()
  }, [uid, refresh])

  return stats
}