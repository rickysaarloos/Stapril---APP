import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { vandaagISO, stappenDocId } from './datum'

export async function laadStappenVandaag(uid) {
  const id = stappenDocId(uid)
  const snap = await getDoc(doc(db, 'stappen', id))
  return snap.exists() ? snap.data().stappen : null
}

export async function slaStappenOp(uid, stappen) {
  if (!navigator.onLine) {
    throw new Error('Geen internetverbinding.')
  }

  const datum = vandaagISO()
  const id = stappenDocId(uid, datum)

  await setDoc(doc(db, 'stappen', id), {
    uid,
    datum,
    stappen: Number(stappen),
    bijgewerktOp: new Date().toISOString(),
  })
}