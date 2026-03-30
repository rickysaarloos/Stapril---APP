export default function StatCard({ value, label, highlight = false }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1">
      <span className={`text-3xl font-black leading-none ${highlight ? 'text-lime-400' : 'text-zinc-100'}`}>
        {value}
      </span>
      <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold leading-tight">
        {label}
      </span>
    </div>
  )
}