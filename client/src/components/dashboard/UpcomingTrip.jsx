import { FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa'
import { getDaysLabel, getTripCategory } from '../../utils/dateUtils'

export default function UpcomingTrip({ trip }) {
  const category = getTripCategory(trip)
  const daysLabel = getDaysLabel(trip)
  const imageUrl = trip.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=240&q=85'
  const dateStr = trip.date || (trip.startDate ? `${new Date(trip.startDate).toLocaleDateString()}–${new Date(trip.endDate).toLocaleDateString()}` : 'TBD')
  const participantCount = trip.participants?.length || trip.people || 1
  const readiness = trip.progress || trip.readiness || (category === 'past' ? 100 : 45)

  return (
    <article className="upcoming-trip">
      <img src={imageUrl} alt={trip.name} />
      <div className="trip-details">
        <div className="trip-name-row">
          <h3>{trip.name}</h3>
          <span className={`trip-status ${category}`}>{category}</span>
        </div>
        <p><FaMapMarkerAlt /> {trip.location}</p>
        <div className="trip-meta">
          <span><FaCalendarAlt /> {dateStr}</span>
          <span><FaUsers /> {participantCount} people</span>
        </div>
        <div className="trip-progress">
          <i style={{ width: `${readiness}%` }} />
          <b>{readiness}%</b>
          <strong>{daysLabel}</strong>
        </div>
      </div>
    </article>
  )
}
