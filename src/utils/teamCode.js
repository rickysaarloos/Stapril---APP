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
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── Join-code generator ───────────────────────────────────────────────────────

const WOORDEN = ['STAP', 'TEAM', 'LOOP', 'APRIL', 'FIT', 'RUN', 'MOVE', 'GO']

/**
 * Genereert een willekeurige join-code (bijv. APRIL42).
 * @returns {string}
 */
function genereerCode() {
  const woord = WOORDEN[Math.floor(Math.random() * WOORDEN.length)]
  const getal = Math.floor(10 + Math.random() * 90) // 10–99
  return `${woord}${getal}`
}

/**
 * Genereert een unieke join-code die nog niet bestaat in Firestore.
 * @returns {Promise<string>}
 */
async function uniekCode() {
  let code
  let geprobeerd = 0
  do {
    code = genereerCode()
    geprobeerd++
    if (geprobeerd > 20) break // veiligheidsklep
  } while (await codeBestaatAl(code))
  return code
}

/**
 * Controleert of een join-code al in gebruik is.
 * @param {string} code Join-code
 * @returns {Promise<boolean>} True als code bestaat
 */
async function codeBestaatAl(code) {
  const q = query(collection(db, 'teams'), where('joinCode', '==', code))
  const snap = await getDocs(q)
  return !snap.empty
}

// ── Team aanmaken ─────────────────────────────────────────────────────────────

/**
 * Maakt een nieuw team aan in Firestore en voegt de aanmaker toe als lid.
 * Geeft het nieuwe team-object terug { id, naam, joinCode, ... }.
 */
export async function maakTeamAan(uid, teamnaam) {
  const joinCode = await uniekCode()
  const teamRef = doc(collection(db, 'teams'))

  await setDoc(teamRef, {
    naam: teamnaam.trim(),
    joinCode,
    leden: [uid],
    gemaaktOp: serverTimestamp(), // ✅ FIX
    aangemaaktDoor: uid,
  })

  // Koppel teamId aan gebruiker
await setDoc(doc(db, 'users', uid), { teamId: teamRef.id }, { merge: true })

  return { id: teamRef.id, naam: teamnaam.trim(), joinCode, leden: [uid] }
}

// ── Team aansluiten ───────────────────────────────────────────────────────────

/**
 * Zoek een team op via de join-code.
 * Geeft het team-document terug { id, ...data } of null als niet gevonden.
 */
export async function zoekTeamOpCode(code) {
  const q = query(
    collection(db, 'teams'),
    where('joinCode', '==', code.trim().toUpperCase())
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

/**
 * Voeg een gebruiker toe aan een bestaand team.
 */
export async function sluitAanBijTeam(uid, teamId) {
  await updateDoc(doc(db, 'users', uid), { teamId })
  await updateDoc(doc(db, 'teams', teamId), { leden: arrayUnion(uid) })
}

/**
 * Haal een team op via zijn ID.
 */
export async function laadTeam(teamId) {
  if (!teamId) return null
  const snap = await getDoc(doc(db, 'teams', teamId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Team details ──────────────────────────────────────────────────────────────

/**
 * Laad team + alle leden (user data)
 */
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

// ── Team verlaten ─────────────────────────────────────────────────────────────

/**
 * Verlaat een team
 */
export async function verlatenTeam(uid) {
  await updateDoc(doc(db, 'users', uid), { teamId: null })
}