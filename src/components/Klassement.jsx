import { useKlassement } from '../hooks/useKlassement'
import { useAuthContext } from '../context/AuthContext'

export default function Klassement() {
  const { user } = useAuthContext()
  const { klassement, laden } = useKlassement()

  if (laden) {
    return (
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" />
      </div>
    )
  }

  if (klassement.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-center">
        <p className="text-white/30 text-sm">Nog geen teams in het klassement.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-white/5">
        <h2 className="text-white font-bold">Teamklassement</h2>
      </div>

      <div className="divide-y divide-white/5">
        {klassement.map((team, index) => {
          const isEigenTeam = team.id === user?.teamId
          const positie = index + 1

          const positieKleur =
            positie === 1 ? 'text-yellow-400' :
            positie === 2 ? 'text-gray-300' :
            positie === 3 ? 'text-orange-400' :
            'text-white/20'

          return (
            <div
              key={team.id}
              className={`px-5 py-4 flex items-center gap-4 transition-colors
                ${isEigenTeam
                  ? 'bg-[#84cc16]/[0.04] border-l-2 border-l-[#84cc16]'
                  : 'border-l-2 border-l-transparent'
                }`}
            >
              {/* Positie */}
              <span className={`text-lg font-black w-6 text-center ${positieKleur}`}>
                {positie <= 3 ? ['🥇','🥈','🥉'][positie - 1] : positie}
              </span>

              {/* Team info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${isEigenTeam ? 'text-[#84cc16]' : 'text-white'}`}>
                    {team.naam}
                  </p>
                  {isEigenTeam && (
                    <span className="text-[10px] text-[#84cc16]/60 border border-[#84cc16]/20 rounded px-1.5 py-0.5 uppercase tracking-widest shrink-0">
                      jouw team
                    </span>
                  )}
                </div>
                <p className="text-white/30 text-xs mt-0.5">
                  {team.aantalLeden} {team.aantalLeden === 1 ? 'lid' : 'leden'} · ø {team.gemiddeldPerPersoonPerDag.toLocaleString('nl-NL')} stappen/persoon/dag
                </p>
              </div>

              {/* Totaal stappen */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-black ${isEigenTeam ? 'text-[#84cc16]' : 'text-white'}`}>
                  {team.totaalStappen.toLocaleString('nl-NL')}
                </p>
                <p className="text-white/20 text-xs">stappen</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}   