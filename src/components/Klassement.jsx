import { useKlassement } from '../hooks/useKlassement' // Custom hook om klassement data op te halen
import { useAuthContext } from '../context/AuthContext' // Hook om ingelogde gebruiker op te halen

export default function Klassement() { // Component voor het tonen van het teamklassement
  const { user } = useAuthContext() // Haalt huidige gebruiker op
  const { klassement, laden } = useKlassement() // Haalt klassement data en laadstatus op

  if (laden) { // Als data nog aan het laden is
    return (
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-center h-48"> {/* Container voor loader */}
        <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" /> {/* Spinner animatie */}
      </div>
    )
  }

  if (klassement.length === 0) { // Als er geen teams zijn
    return (
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-center"> {/* Lege state container */}
        <p className="text-white/30 text-sm">Nog geen teams in het klassement.</p> {/* Bericht */}
      </div>
    )
  }

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden"> {/* Hoofdcontainer */}
      <div className="p-5 border-b border-white/5"> {/* Header */}
        <h2 className="text-white font-bold">Teamklassement</h2> {/* Titel */}
      </div>

      <div className="divide-y divide-white/5"> {/* Lijst met scheidingslijnen */}
        {klassement.map((team, index) => { // Loop door alle teams
          const isEigenTeam = team.id === user?.teamId // Check of dit het team van de gebruiker is
          const positie = index + 1 // Bepaal positie (index begint bij 0)

          const positieKleur = // Kies kleur op basis van positie
            positie === 1 ? 'text-yellow-400' : // Goud voor plek 1
            positie === 2 ? 'text-gray-300' : // Zilver voor plek 2
            positie === 3 ? 'text-orange-400' : // Brons voor plek 3
            'text-white/20' // Overige posities

          return (
            <div
              key={team.id} // Unieke key voor React
              className={`px-5 py-4 flex items-center gap-4 transition-colors
                ${isEigenTeam
                  ? 'bg-[#84cc16]/[0.04] border-l-2 border-l-[#84cc16]' // Highlight eigen team
                  : 'border-l-2 border-l-transparent' // Geen highlight
                }`}
            >
              {/* Positie */}
              <span className={`text-lg font-black w-6 text-center ${positieKleur}`}> {/* Positie styling */}
                {positie <= 3 ? ['🥇','🥈','🥉'][positie - 1] : positie} {/* Medaille voor top 3, anders nummer */}
              </span>

              {/* Team info */}
              <div className="flex-1 min-w-0"> {/* Zorgt dat tekst netjes afkapt */}
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${isEigenTeam ? 'text-[#84cc16]' : 'text-white'}`}> {/* Teamnaam */}
                    {team.naam}
                  </p>
                  {isEigenTeam && ( // Alleen tonen als dit jouw team is
                    <span className="text-[10px] text-[#84cc16]/60 border border-[#84cc16]/20 rounded px-1.5 py-0.5 uppercase tracking-widest shrink-0">
                      jouw team {/* Label */}
                    </span>
                  )}
                </div>
                <p className="text-white/30 text-xs mt-0.5"> {/* Extra info */}
                  {team.aantalLeden} {team.aantalLeden === 1 ? 'lid' : 'leden'} {/* Enkel/meervoud check */}
                  {' · ø '}
                  {team.gemiddeldPerPersoonPerDag.toLocaleString('nl-NL')} {/* Gemiddelde stappen netjes geformat */}
                  {' stappen/persoon/dag'}
                </p>
              </div>

              {/* Totaal stappen */}
              <div className="text-right shrink-0"> {/* Rechterkolom */}
                <p className={`text-sm font-black ${isEigenTeam ? 'text-[#84cc16]' : 'text-white'}`}> {/* Totaal stappen */}
                  {team.totaalStappen.toLocaleString('nl-NL')} {/* Format met duizendtallen */}
                </p>
                <p className="text-white/20 text-xs">stappen</p> {/* Label */}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}