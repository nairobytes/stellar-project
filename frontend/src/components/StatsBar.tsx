const stats = [
  { value: '7.4M+', label: 'Kenyan SMEs' },
  { value: '60–90', label: 'Days average payment wait' },
  { value: '5%', label: 'Investor yield on principal' },
  { value: '100%', label: 'On-chain audit trail' },
]

export function StatsBar() {
  return (
    <section className="border-b theme-border theme-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-10">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center md:text-left">
            <p className="font-display text-3xl font-bold text-accent md:text-4xl">{stat.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.28em] text-subtle">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
