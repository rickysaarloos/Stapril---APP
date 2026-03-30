import StatCard from './StatCard'

export default function StatsRow({ stats }) {
  const { totalSteps, goalDays, streak } = stats

  // Maak grote getallen leesbaar: 148500 → 148.5k
  const formatSteps = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
    return n.toString()
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        value={formatSteps(totalSteps)}
        label="Totaal stappen"
      />
      <StatCard
        value={goalDays}
        label="Dagen doel gehaald"
        highlight
      />
      <StatCard
        value={`🔥 ${streak}`}
        label="Huidige streak"
      />
    </div>
  )
}