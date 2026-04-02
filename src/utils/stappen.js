import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { vandaagISO, stappenDocId } from './datum'

/**
 * Laadt het aantal stappen voor vandaag van een gebruiker.
 * @param {string} uid Gebruikers-ID
 * @returns {Promise<number|null>} Aantal stappen of null als niet aanwezig
 */
export async function laadStappenVandaag(uid) {
  const id = stappenDocId(uid)
  const snap = await getDoc(doc(db, 'stappen', id))
  return snap.exists() ? snap.data().stappen : null
}

/**
 * Slaat stappen op voor de huidige datum in Firestore.
 * @param {string} uid Gebruikers-ID
 * @param {number|string} stappen Aantal stappen
 * @returns {Promise<void>}
 */
export async function slaStappenOp(uid, stappen) {
  const datum = vandaagISO()
  const id = stappenDocId(uid, datum)

  await setDoc(doc(db, 'stappen', id), {
    uid,
    datum,
    stappen: Number(stappen),
    bijgewerktOp: new Date().toISOString(),
  })
}