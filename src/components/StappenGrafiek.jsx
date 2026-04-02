import {
  ResponsiveContainer, // Zorgt dat de grafiek zich aanpast aan de containergrootte
  BarChart, // Hoofdcomponent voor een staafdiagram
  Bar, // De balken (staven) in de grafiek
  XAxis, // X-as (horizontaal)
  YAxis, // Y-as (verticaal)
  ReferenceLine, // Horizontale lijn (bijv. dagdoel)
  Cell, // Individuele balk styling
  Tooltip, // Hover tooltip
} from 'recharts'
import { useStappenGrafiek } from '../hooks/useStappenGrafiek' // Custom hook om grafiekdata op te halen

const DAGDOEL = 10000 // Constante voor het dagelijkse stappen-doel

function CustomTooltip({ active, payload, label }) { // Custom tooltip component
  if (!active || !payload?.length) return null // Toon niets als tooltip niet actief is
  const stappen = payload[0]?.value // Haalt aantal stappen uit de data
  if (stappen === null || stappen === undefined) return null // Geen waarde → niets tonen

  const gehaald = stappen >= DAGDOEL // Check of dagdoel is gehaald

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-xl"> {/* Tooltip container */}
      <p className="text-white/40 mb-1">Dag {label}</p> {/* Dagnummer */}
      <p className={`font-bold text-sm ${gehaald ? 'text-[#84cc16]' : 'text-white'}`}> {/* Kleur afhankelijk van doel */}
        {stappen.toLocaleString('nl-NL')} stappen {/* Format stappen */}
      </p>
      {gehaald && <p className="text-[#84cc16]/60 mt-0.5">✓ Dagdoel gehaald</p>} {/* Extra tekst als doel gehaald */}
    </div>
  )
}

function LegeStaat() { // Component voor lege grafiek (geen data)
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center"> {/* Container */}
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl">
        👟 {/* Icoon */}
      </div>
      <div>
        <p className="text-white/60 text-sm font-medium">Nog geen stappen ingevoerd</p> {/* Titel */}
        <p className="text-white/25 text-xs mt-1">Voer je eerste stappen in om je grafiek te zien</p> {/* Subtekst */}
      </div>
    </div>
  )
}

export default function StappenGrafiek({ uid, refresh }) { // Hoofdcomponent voor grafiek
  const { data, laden } = useStappenGrafiek(uid, refresh) // Haalt data en loading status op

  const nu = new Date() // Huidige datum
  const heeftData = data.some(d => d.stappen !== null) // Check of er überhaupt data is
  const vandaagDag = nu.getDate() // Huidige dag van de maand
  const maandNaam = nu.toLocaleString('nl-NL', { month: 'long', year: 'numeric' }) // Huidige maand + jaar

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4"> {/* Hoofdcontainer */}
      <div className="flex items-center justify-between"> {/* Header */}
        <div>
          <h2 className="text-white font-bold">Stappen per dag</h2> {/* Titel */}
          <p className="text-white/30 text-xs mt-0.5">{maandNaam}</p> {/* Maand */}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30"> {/* Legenda */}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#84cc16]" /> {/* Groen blokje */}
            Dagdoel gehaald
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-white/20" /> {/* Grijs blokje */}
            Onder doel
          </span>
        </div>
      </div>

      {laden ? ( // Als data laadt
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" /> {/* Spinner */}
        </div>
      ) : !heeftData ? ( // Geen data
        <LegeStaat /> // Toon lege staat
      ) : (
        <div className="w-full h-52"> {/* Grafiek container */}
          <ResponsiveContainer width="100%" height="100%"> {/* Responsive wrapper */}
            <BarChart
              data={data} // Data voor grafiek
              margin={{ top: 8, right: 0, left: -24, bottom: 0 }} // Marges
              barCategoryGap="20%" // Ruimte tussen balken
            >
              <XAxis
                dataKey="dag" // Gebruikt 'dag' als X waarde
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} // Styling ticks
                tickLine={false} // Geen lijntjes
                axisLine={false} // Geen aslijn
                interval={4} // Toon elke 5e label
                tickFormatter={d => `${d}`} // Format dag
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} // Styling
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} // 1000 → 1k
              />
              <Tooltip
                content={<CustomTooltip />} // Gebruik custom tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 4 }} // Hover effect
              />
              <ReferenceLine
                y={DAGDOEL} // Horizontale lijn op 10k
                stroke="rgba(132,204,22,0.4)" // Kleur
                strokeDasharray="4 4" // Gestippeld
                label={{
                  value: '10k', // Label tekst
                  position: 'insideTopRight', // Positie
                  fill: 'rgba(132,204,22,0.5)', // Kleur
                  fontSize: 10,
                }}
              />
              <Bar dataKey="stappen" radius={[3, 3, 0, 0]} maxBarSize={20}> {/* Balken */}
                {data.map((entry) => { // Loop door data voor kleur per balk
                  const isVandaag = entry.dag === vandaagDag // Check of het vandaag is
                  const gehaald = (entry.stappen ?? 0) >= DAGDOEL // Doel gehaald?
                  const leeg = entry.stappen === null // Geen data?

                  return (
                    <Cell
                      key={entry.datum} // Unieke key
                      fill={
                        leeg
                          ? 'rgba(255,255,255,0.05)' // Leeg → heel licht
                          : gehaald
                          ? '#84cc16' // Doel gehaald → groen
                          : isVandaag
                          ? 'rgba(255,255,255,0.35)' // Vandaag → iets lichter
                          : 'rgba(255,255,255,0.15)' // Normaal → grijs
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