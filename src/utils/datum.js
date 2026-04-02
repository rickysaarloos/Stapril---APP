// Geeft de huidige datum terug in ISO-formaat (YYYY-MM-DD)
export function vandaagISO() {
  const nu = new Date()                     // Maak een nieuwe Date object met de huidige datum en tijd
  const jaar = nu.getFullYear()             // Haal het volledige jaar uit het Date object
  const maand = String(nu.getMonth() + 1)  // Haal de maand op (0-11) en tel 1 op om 1-12 te krijgen
    .padStart(2, '0')                       // Voeg een nul toe aan het begin als het een cijfer < 10 is
  const dag = String(nu.getDate())          // Haal de dag van de maand op
    .padStart(2, '0')                       // Voeg een nul toe als het < 10 is
  return `${jaar}-${maand}-${dag}`           // Combineer alles tot een string in ISO-formaat
}

// Maakt een unieke document-ID voor een gebruiker op een specifieke datum
export function stappenDocId(uid, datum = vandaagISO()) {
  return `${uid}_${datum}`                  // Combineer user ID en datum met een underscore
}

// Geeft de dag van de maand terug (1 t/m 31)
export function dagVanMaand() {
  return new Date().getDate()               // Haal alleen de dag van de maand uit het huidige Date object
}

// Geeft de dag van april terug (1 t/m 30), genormaliseerd
export function dagVanApril() {
  const nu = new Date()                      // Huidige datum
  const start = new Date(nu.getFullYear(), 3, 1) // 1 april van dit jaar (maandindex 3 = april)
  const diff = Math.floor((nu - start) / (1000 * 60 * 60 * 24)) + 1 // Bereken hoeveel dagen zijn verstreken sinds 1 april
  return Math.min(Math.max(diff, 1), 30)    // Beperk het resultaat tot tussen 1 en 30
}