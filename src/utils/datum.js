/**
 * Geeft de huidige datum terug in ISO-formaat (JJJJ-MM-DD).
 * @returns {string} ISO datumstring
 */
export function vandaagISO() {
  const nu = new Date()
  const jaar = nu.getFullYear()
  const maand = String(nu.getMonth() + 1).padStart(2, '0')
  const dag = String(nu.getDate()).padStart(2, '0')
  return `${jaar}-${maand}-${dag}`
}

/**
 * Bouwt een document-ID voor stappendata op basis van gebruiker en datum.
 * @param {string} uid Gebruiker-ID
 * @param {string} [datum=vandaagISO()] Datum in ISO-formaat
 * @returns {string} Document-ID (uid_datum)
 */
export function stappenDocId(uid, datum = vandaagISO()) {
  return `${uid}_${datum}`
}

/**
 * Huidige dag van de maand (1-31).
 * @returns {number}
 */
export function dagVanMaand() {
  return new Date().getDate()
}

/**
 * Dagnummer in april (1-30) met afronding van onder/boven.
 * @returns {number}
 */
export function dagVanApril() {
  const nu = new Date()
  const start = new Date(nu.getFullYear(), 3, 1)
  const diff = Math.floor((nu - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.min(Math.max(diff, 1), 30)
}