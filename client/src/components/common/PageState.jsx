export function EmptyState({ icon = '🌲', title, description, action }) {
  return <section className="page-state"><span>{icon}</span><h2>{title}</h2><p>{description}</p>{action}</section>
}

export function LoadingState({ label = 'Loading your adventure...' }) {
  return <section className="page-state loading-state"><i /><p>{label}</p></section>
}
