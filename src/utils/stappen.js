import { doc, getDoc, setDoc } from 'firebase/firestore'  // Haal Firestore functies op voor documenten
import { db } from '../firebase'                           // Importeer de Firestore database-instantie
import { vandaagISO, stappenDocId } from './datum'        // Importeer datumhelpers

// ── Laad het aantal stappen van vandaag voor een gebruiker
export async function laadStappenVandaag(uid) {
  const id = stappenDocId(uid)                           // Genereer document-ID voor vandaag, bv. "uid_2026-04-02"
  const snap = await getDoc(doc(db, 'stappen', id))      // Haal het document op uit collectie "stappen"
  return snap.exists() ? snap.data().stappen : null      // Als het document bestaat, geef het stappenveld terug, anders null
}

// ── Sla stappen op in Firestore voor een gebruiker
export async function slaStappenOp(uid, stappen) {
  if (!navigator.onLine) {                               // Controleer of de gebruiker online is
    throw new Error('Geen internetverbinding.')          // Anders gooi een foutmelding
  }

  const datum = vandaagISO()                              // Huidige datum in ISO-formaat
  const id = stappenDocId(uid, datum)                    // Document-ID voor deze gebruiker en datum

  await setDoc(doc(db, 'stappen', id), {                // Schrijf of overschrijf het document in Firestore
    uid,                                                 // User ID
    datum,                                               // Datum van vandaag
    stappen: Number(stappen),                            // Aantal stappen als getal
    bijgewerktOp: new Date().toISOString(),             // Tijdstip van update als ISO-string
  })
}