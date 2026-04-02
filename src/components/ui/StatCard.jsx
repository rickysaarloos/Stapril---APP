export default function StatCard({ value, label, highlight = false }) { // Definieert een component voor een statistiek-kaart met value, label en optionele highlight
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1"> {/* Container met styling (Tailwind): donkere achtergrond, rand, afgeronde hoeken en gecentreerde content */}
      <span className={`text-3xl font-black leading-none ${highlight ? 'text-lime-400' : 'text-zinc-100'}`}> {/* Groot getal met dynamische kleur afhankelijk van highlight */}
        {value} {/* Toont de waarde (bijv. een getal of statistiek) */}
      </span>
      <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold leading-tight"> {/* Kleine tekst voor label met spacing en styling */}
        {label} {/* Toont het label (bijv. "Users", "Sales", etc.) */}
      </span>
    </div>
  )
}