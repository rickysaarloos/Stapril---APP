import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
  Tooltip,
} from 'recharts'
import { useStappenGrafiek } from '../hooks/useStappenGrafiek'

const DAGDOEL = 10000

// ── Custom tooltip ────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const stappen = payload[0]?.value
  if (stappen === null || stappen === undefined) return null

  const gehaald = stappen >= DAGDOEL

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-white/40 mb-1">Dag {label}</p>
      <p className={`font-bold text-sm ${gehaald ? 'text-[#84cc16]' : 'text-white'}`}>
        {stappen.toLocaleString('nl-NL')} stappen
      </p>
      {gehaald && <p className="text-[#84cc16]/60 mt-0.5">✓ Dagdoel gehaald</p>}
    </div>
  )
}

// ── Lege staat ────────────────────────────────────────────
function LegeStaat() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl">
        👟
      </div>
      <div>
        <p className="text-white/60 text-sm font-medium">Nog geen stappen ingevoerd</p>
        <p className="text-white/25 text-xs mt-1">Voer je eerste stappen in om je grafiek te zien</p>
      </div>
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────
export default function StappenGrafiek({ uid, refresh }) {
  const { data, laden } = useStappenGrafiek(uid, refresh)

  const heeftData = data.some(d => d.stappen !== null)
  const vandaagDag = (() => {
    const nu = new Date()
    const start = new Date(nu.getFullYear(), 3, 1)
    return Math.floor((nu - start) / (1000 * 60 * 60 * 24)) + 1
  })()

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold">Stappen per dag</h2>
          <p className="text-white/30 text-xs mt-0.5">april 2025</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#84cc16]" />
            Dagdoel gehaald
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-white/20" />
            Onder doel
          </span>
        </div>
      </div>

      {laden ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" />
        </div>
      ) : !heeftData ? (
        <LegeStaat />
      ) : (
        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 0, left: -24, bottom: 0 }}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="dag"
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
                tickFormatter={d => `${d}`}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 4 }}
              />
              <ReferenceLine
                y={DAGDOEL}
                stroke="rgba(132,204,22,0.4)"
                strokeDasharray="4 4"
                label={{
                  value: '10k',
                  position: 'insideTopRight',
                  fill: 'rgba(132,204,22,0.5)',
                  fontSize: 10,
                }}
              />
              <Bar dataKey="stappen" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {data.map((entry) => {
                  const isVandaag = entry.dag === vandaagDag
                  const gehaald = (entry.stappen ?? 0) >= DAGDOEL
                  const leeg = entry.stappen === null

                  return (
                    <Cell
                      key={entry.datum}
                      fill={
                        leeg
                          ? 'rgba(255,255,255,0.05)'
                          : gehaald
                          ? '#84cc16'
                          : isVandaag
                          ? 'rgba(255,255,255,0.35)'
                          : 'rgba(255,255,255,0.15)'
                      }
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}