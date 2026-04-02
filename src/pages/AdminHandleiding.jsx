import { useNavigate } from 'react-router-dom'

export default function AdminHandleiding() {
  const navigate = useNavigate()

  const Section = ({ title, children }) => (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-3">
      <h2 className="text-white font-bold text-lg">{title}</h2>
      <div className="text-white/50 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )

  const Stap = ({ nr, tekst }) => (
    <div className="flex items-start gap-3">
      <span className="w-5 h-5 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 text-[#84cc16] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
        {nr}
      </span>
      <p className="text-white/50 text-sm">{tekst}</p>
    </div>
  )

  const Info = ({ label, desc }) => (
    <div className="flex gap-3">
      <span className="text-[#84cc16] shrink-0">·</span>
      <p><span className="text-white/70 font-medium">{label}</span> — {desc}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span>
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
          <span className="text-[#84cc16] text-xs border border-[#84cc16]/30 rounded px-2 py-0.5 tracking-widest uppercase hidden sm:block">
            Admin
          </span>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-2.5 py-1.5"
        >
          ← Terug
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">documentatie</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Adminhandleiding
          </h1>
          <p className="text-white/30 text-sm mt-2">
            Alles wat je moet weten om de Stapril challenge te beheren.
          </p>
        </div>

        {/* Navigatie */}
        <Section title="Navigatie">
          <Info label="Dashboard" desc="Ga terug naar het deelnemersdashboard via de knop rechtsboven." />
          <Info label="Uitloggen" desc="Log uit via de knop rechtsboven in de navbar." />
        </Section>

        {/* Challenge beheer */}
        <Section title="Challenge beheer">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Challenge starten</p>
          <div className="space-y-2">
            <Stap nr="1" tekst="Ga naar het Admin panel." />
            <Stap nr="2" tekst='Bovenaan zie je de Challenge status kaart.' />
            <Stap nr="3" tekst='Klik op de groene knop "Challenge starten".' />
            <Stap nr="4" tekst="De kaart wordt groen en toont de startdatum. Deelnemers kunnen nu stappen invoeren." />
          </div>

          <div className="border-t border-white/5 pt-4 mt-4 space-y-2">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Challenge beëindigen</p>
            <Stap nr="1" tekst="Ga naar het Admin panel." />
            <Stap nr="2" tekst='Klik op de rode knop "Challenge beëindigen".' />
            <Stap nr="3" tekst="De einddatum wordt opgeslagen en de challenge is inactief." />
          </div>
        </Section>

        {/* Statistieken */}
        <Section title="Statistieken">
          <p>Bovenaan zie je vier tellers:</p>
          <div className="space-y-1.5">
            <Info label="Deelnemers" desc="Aantal accounts met de rol deelnemer." />
            <Info label="Admins" desc="Aantal accounts met de rol admin." />
            <Info label="In een team" desc="Aantal deelnemers dat gekoppeld is aan een team." />
            <Info label="Teams" desc="Totaal aantal aangemaakte teams." />
          </div>

          <div className="border-t border-white/5 pt-4 mt-2 space-y-1.5">
            <p>Onder <span className="text-white/70">Statistieken vandaag</span> zie je:</p>
            <Info label="Dagdoel gehaald" desc="Percentage deelnemers met ≥ 10.000 stappen vandaag." />
            <Info label="Gem. stappen vandaag" desc="Gemiddeld aantal stappen over alle deelnemers." />
            <Info label="Totaal stappen ooit" desc="Alle stappen opgeteld over alle dagen en deelnemers." />
            <Info label="Invoer vandaag" desc="Hoeveel deelnemers al stappen hebben ingevoerd vandaag." />
          </div>

          <div className="border-t border-white/5 pt-4 mt-2">
            <p>Klik op <span className="text-white/70 font-medium">Exporteren CSV</span> om alle gebruikersdata te downloaden als bestand dat je kan openen in Excel of Google Sheets.</p>
          </div>
        </Section>

        {/* Uitlichting */}
        <Section title="Meest actief & beste team">
          <Info label="Meest actief" desc="De deelnemer met het hoogste totaal aantal stappen." />
          <Info label="Beste team" desc="Het team met het hoogste totaal aantal stappen." />
        </Section>

        {/* Teams */}
        <Section title="Teams">
          <p>Overzicht van alle teams gesorteerd op stappen (hoog naar laag). Per team zie je:</p>
          <Info label="Naam" desc="De teamnaam." />
          <Info label="Leden" desc="Aantal deelnemers in het team." />
          <Info label="Join-code" desc="De code waarmee nieuwe leden kunnen aansluiten." />
          <Info label="Stappen" desc="Totaal aantal stappen van het hele team." />
        </Section>

        {/* Gebruikers */}
        <Section title="Gebruikersbeheer">
          <p>Onderaan het admin panel zie je alle accounts.</p>
          <div className="space-y-1.5 mt-2">
            <Info label="Zoeken" desc="Zoek op naam of e-mailadres via het zoekveld." />
            <Info label="Stappen" desc="Per gebruiker zie je stappen vandaag en totaal stappen." />
            <Info label="Rol wijzigen" desc='Klik "Maak admin" of "Maak deelnemer" om de rol aan te passen.' />
            <Info label="Eigen rol" desc="Je kunt je eigen rol niet wijzigen." />
          </div>
        </Section>

        {/* Terug knop */}
        <button
          onClick={() => navigate('/admin')}
          className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all duration-200"
        >
          ← Terug naar admin panel
        </button>

      </main>            
    </div>
  )
}