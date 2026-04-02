import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore' // Haal Firestore functies op voor queries en documentbewerkingen
import { db } from '../firebase' // Importeer je Firestore database-instantie

// ── Join-code generator ────────────────────────────────────────────────

const WOORDEN = ['STAP', 'TEAM', 'LOOP', 'APRIL', 'FIT', 'RUN', 'MOVE', 'GO'] 
// Woordenlijst voor join-codes

function genereerCode() {
  const woord = WOORDEN[Math.floor(Math.random() * WOORDEN.length)] 
  // Kies willekeurig een woord uit de lijst
  const getal = Math.floor(10 + Math.random() * 90) 
  // Kies een willekeurig getal tussen 10–99
  return `${woord}${getal}` 
  // Combineer tot bijv. "TEAM42"
}

/**
 * Genereert een unieke join-code die nog niet bestaat in Firestore.
 */
async function uniekCode() {
  let code
  let geprobeerd = 0
  do {
    code = genereerCode() // Genereer een code
    geprobeerd++
    if (geprobeerd > 20) break // veiligheidsklep om oneindige loop te voorkomen
  } while (await codeBestaatAl(code)) // Herhaal totdat de code uniek is
  return code
}

async function codeBestaatAl(code) {
  const q = query(collection(db, 'teams'), where('joinCode', '==', code))
  const snap = await getDocs(q) // Zoek in Firestore of de code al bestaat
  return !snap.empty
}

// ── Team aanmaken ───────────────────────────────────────────────────────

/**
 * Maakt een nieuw team aan in Firestore en voegt de aanmaker toe als lid.
 * Geeft het nieuwe team-object terug { id, naam, joinCode, ... }.
 */
export async function maakTeamAan(uid, teamnaam) {
  const joinCode = await uniekCode() // Genereer een unieke join-code
  const teamRef = doc(collection(db, 'teams')) // Maak nieuw documentreferentie voor team

  await setDoc(teamRef, {
    naam: teamnaam.trim(),          // Teamnaam
    joinCode,                        // Join-code
    leden: [uid],                    // De aanmaker als eerste lid
    aangemaaktOp: new Date().toISOString(), // Datum van aanmaken
    aangemaaktDoor: uid,             // UID van de aanmaker
  })

  // Koppel teamId aan gebruiker
  await updateDoc(doc(db, 'users', uid), { teamId: teamRef.id })

  return { id: teamRef.id, naam: teamnaam.trim(), joinCode, leden: [uid] }
}

// ── Team aansluiten ─────────────────────────────────────────────────────

/**
 * Zoek een team op via de join-code.
 * Geeft het team-document terug { id, ...data } of null als niet gevonden.
 */
export async function zoekTeamOpCode(code) {
  const q = query(
    collection(db, 'teams'),
    where('joinCode', '==', code.trim().toUpperCase()) // Codes worden hoofdlettergevoelig opgeslagen
  )
  const snap = await getDocs(q) // Voer query uit
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

/**
 * Voeg een gebruiker toe aan een bestaand team.
 */
export async function sluitAanBijTeam(uid, teamId) {
  await updateDoc(doc(db, 'users', uid), { teamId }) // Update user's teamId
  await updateDoc(doc(db, 'teams', teamId), { leden: arrayUnion(uid) }) 
  // Voeg UID toe aan leden-array zonder duplicaten
}

/**
 * Haal een team op via zijn ID.
 */
export async function laadTeam(teamId) {
  if (!teamId) return null
  const snap = await getDoc(doc(db, 'teams', teamId)) // Haal teamdocument
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Laad alle leden van een team
export async function laadTeamDetails(teamId) {
  const teamSnap = await getDoc(doc(db, 'teams', teamId))
  if (!teamSnap.exists()) return null

  const teamData = { id: teamSnap.id, ...teamSnap.data() }

  // Haal alle users op met dit teamId
  const q = query(collection(db, 'users'), where('teamId', '==', teamId))
  const ledenSnap = await getDocs(q)
  const leden = ledenSnap.docs.map(d => ({ uid: d.id, ...d.data() }))

  return { ...teamData, leden }
}

// Verlaat een team
export async function verlatenTeam(uid) {
  await updateDoc(doc(db, 'users', uid), { teamId: null }) // Zet teamId van user op null
}