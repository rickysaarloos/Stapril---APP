import StatCard from './StatCard' // Importeert de StatCard component om individuele statistieken weer te geven

export default function StatsRow({ stats }) { // Definieert een component die een rij van statistieken toont
  const { totalSteps, goalDays, streak } = stats // Haalt specifieke waarden uit het stats object

  // Maak grote getallen leesbaar: 148500 → 148.5k
  const formatSteps = (n) => { // Functie om grote getallen korter weer te geven
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k' // Als ≥1000: deel door 1000 en voeg 'k' toe (bijv. 1.5k)
    return n.toString() // Anders: gewoon als string teruggeven
  }

  return (
    <div className="grid grid-cols-3 gap-3"> {/* Grid layout met 3 kolommen en ruimte ertussen */}
      <StatCard
        value={formatSteps(totalSteps)} // Geeft geformatteerde stappen door als waarde
        label="Totaal stappen" // Label voor deze statistiek
      />
      <StatCard
        value={goalDays} // Aantal dagen dat doel is gehaald
        label="Dagen doel gehaald" // Label voor deze statistiek
        highlight // Zet highlight aan (andere kleur)
      />
      <StatCard
        value={`🔥 ${streak}`} // Toont de streak met een fire emoji ervoor
        label="Huidige streak" // Label voor deze statistiek
      />
    </div>
  )
}