export default function StatCard({ icon, label, value, detail, tone = 'green' }) {
  return (
    <article className={`stat-card stat-${tone} min-w-0`}>
      <span className="stat-icon shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate m-0">{label}</p>
        <strong className="truncate block">{value}</strong>
        <small className="truncate block">{detail}</small>
      </div>
    </article>
  )
}
