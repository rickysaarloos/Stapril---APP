import { useState } from 'react'
import { useKlassement } from '../hooks/useKlassement'
import { useLopers } from '../hooks/useLopers'
import { useAuthContext } from '../context/AuthContext'
 
const MEDAILLES = ['🥇', '🥈', '🥉']
 
function PosLabel({ positie }) {
  const kleur =
    positie === 1 ? 'text-yellow-400' :
    positie === 2 ? 'text-gray-300' :
    positie === 3 ? 'text-orange-400' :
    'text-white/20'
 
  return (
    <span className={`text-lg font-black w-6 text-center shrink-0 ${kleur}`}>
      {positie <= 3 ? MEDAILLES[positie - 1] : positie}
    </span>
  )
}
 
function TeamRij({ team, isEigen }) {
  return (
    <div className={`px-5 py-4 flex items-center gap-4 transition-colors
      ${isEigen
        ? 'bg-[#84cc16]/[0.04] border-l-2 border-l-[#84cc16]'
        : 'border-l-2 border-l-transparent'
      }`}
    >
      <PosLabel positie={team.positie} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold truncate ${isEigen ? 'text-[#84cc16]' : 'text-white'}`}>
            {team.naam}
          </p>
          {isEigen && (
            <span className="text-[10px] text-[#84cc16]/60 border border-[#84cc16]/20 rounded px-1.5 py-0.5 uppercase tracking-widest shrink-0">
              jouw team
            </span>
          )}
        </div>
        <p className="text-white/30 text-xs mt-0.5">
          {team.aantalLeden} {team.aantalLeden === 1 ? 'lid' : 'leden'} · ø {team.gemiddeldPerPersoonPerDag.toLocaleString('nl-NL')} stappen/persoon/dag
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-black ${isEigen ? 'text-[#84cc16]' : 'text-white'}`}>
          {team.totaalStappen.toLocaleString('nl-NL')}
        </p>
        <p className="text-white/20 text-xs">stappen</p>
      </div>
    </div>
  )
}
 
function LoperRij({ loper, isEigen }) {
  return (
    <div className={`px-5 py-4 flex items-center gap-4 transition-colors
      ${isEigen
        ? 'bg-[#84cc16]/[0.04] border-l-2 border-l-[#84cc16]'
        : 'border-l-2 border-l-transparent'
      }`}
    >
      <PosLabel positie={loper.positie} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold truncate ${isEigen ? 'text-[#84cc16]' : 'text-white'}`}>
            {loper.naam}
          </p>
          {isEigen && (
            <span className="text-[10px] text-[#84cc16]/60 border border-[#84cc16]/20 rounded px-1.5 py-0.5 uppercase tracking-widest shrink-0">
              jij
            </span>
          )}
        </div>
        <p className="text-white/30 text-xs mt-0.5">
          ø {loper.gemiddeldPerDag.toLocaleString('nl-NL')} stappen/dag · {loper.aantalDagen} {loper.aantalDagen === 1 ? 'dag' : 'dagen'} actief
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-black ${isEigen ? 'text-[#84cc16]' : 'text-white'}`}>
          {loper.totaalStappen.toLocaleString('nl-NL')}
        </p>
        <p className="text-white/20 text-xs">stappen</p>
      </div>
    </div>
  )
}
 
export default function Klassement() {
  const { user } = useAuthContext()
  const { klassement, laden: teamsLaden } = useKlassement()
  const { lopers, laden: lopersLaden } = useLopers()
  const [actieveTab, setActieveTab] = useState('teams')
 
  const laden = actieveTab === 'teams' ? teamsLaden : lopersLaden
 
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
 
      {/* Header met tabs */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4">
        <h2 className="text-white font-bold">Klassement</h2>
        <div className="flex items-center bg-white/[0.04] rounded-xl p-1 gap-1">
          <button
            onClick={() => setActieveTab('teams')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200
              ${actieveTab === 'teams'
                ? 'bg-[#84cc16] text-[#0a0a0a]'
                : 'text-white/40 hover:text-white'
              }`}
          >
            Teams
          </button>
          <button
            onClick={() => setActieveTab('lopers')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200
              ${actieveTab === 'lopers'
                ? 'bg-[#84cc16] text-[#0a0a0a]'
                : 'text-white/40 hover:text-white'
              }`}
          >
            Lopers
          </button>
        </div>
      </div>
 
      {/* Inhoud */}
      {laden ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" />
        </div>
      ) : actieveTab === 'teams' ? (
        klassement.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-white/30 text-sm">Nog geen teams in het klassement.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {klassement.map((team, i) => (
              <TeamRij
                key={team.id}
                team={{ ...team, positie: i + 1 }}
                isEigen={team.id === user?.teamId}
              />
            ))}
          </div>
        )
      ) : (
        lopers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-white/30 text-sm">Nog geen lopers met stappen.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {lopers.map((loper, i) => (
              <LoperRij
                key={loper.uid}
                loper={{ ...loper, positie: i + 1 }}
                isEigen={loper.uid === user?.uid}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}