import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaChevronRight } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { getDaysLabel, getTripCategory } from '../../utils/dateUtils'
import { getImageUrl } from '../../utils/imageUtils'

export default function UpcomingTrip({ trip }) {
  const category = getTripCategory(trip)
  const daysLabel = getDaysLabel(trip)
  const imageUrl = trip.image || trip.campsiteId?.images?.[0] || trip.campsiteId?.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=240&q=85'
  const dateStr = trip.date || (trip.startDate ? `${new Date(trip.startDate).toLocaleDateString()}–${new Date(trip.endDate).toLocaleDateString()}` : 'TBD')
  const participantCount = trip.participants?.length || trip.people || 1
  const tripId = trip._id || trip.id

  return (
    <Link
      to={`/trips/${tripId}`}
      className="group flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 hover:border-emerald-400/60 bg-white hover:bg-emerald-50/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 no-underline text-inherit max-w-full overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 shadow-xs border border-gray-100">
        <img
          src={getImageUrl(imageUrl)}
          alt={trip.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Main Trip Details */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate m-0 min-w-0">
            {trip.name}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${
            category === 'upcoming' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/70' :
            category === 'ongoing' ? 'bg-blue-100 text-blue-800 border border-blue-200/70' :
            'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {category}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-gray-500 truncate m-0 min-w-0">
          <FaMapMarkerAlt className="shrink-0 text-emerald-600 text-xs" />
          <span className="truncate">{trip.location}</span>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-gray-500 font-medium min-w-0">
            <span className="flex items-center gap-1 min-w-0">
              <FaCalendarAlt className="text-emerald-600/80 text-[10px] shrink-0" />
              <span className="truncate">{dateStr}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <FaUsers className="text-emerald-600/80 text-[10px] shrink-0" />
              {participantCount} {participantCount === 1 ? 'person' : 'people'}
            </span>
          </div>

          {daysLabel && (
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 bg-gray-100 group-hover:bg-emerald-100/70 group-hover:text-emerald-800 px-2 py-0.5 rounded-full border border-gray-200/80 group-hover:border-emerald-200 transition-colors shrink-0">
              {daysLabel}
            </span>
          )}
        </div>
      </div>

      {/* Hover Arrow Indicator */}
      <div className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all pl-0.5 pr-0.5 shrink-0 hidden xs:block sm:block">
        <FaChevronRight className="text-xs" />
      </div>
    </Link>
  )
}
