export default function StatCard({ icon, label, value, detail, tone = 'green' }) {
  return <article className={`stat-card stat-${tone}`}><span className="stat-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>
}
