import { useEffect, useState } from 'react'
import { FaCheckCircle, FaCloudSun, FaRegCompass, FaRegListAlt, FaUsers, FaUmbrella, FaWind, FaTint, FaExclamationTriangle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader'
import AppSidebar from '../components/layout/AppSidebar'
import MobileNav from '../components/layout/MobileNav'
import StatCard from '../components/dashboard/StatCard'
import UpcomingTrip from '../components/dashboard/UpcomingTrip'
import WeatherIcon from '../components/common/WeatherIcon'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import { weatherService } from '../services/weatherService'
import { checklistService } from '../services/checklistService'
import { getGreeting, getTripCategory } from '../utils/dateUtils'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState(null)
  const [checklistStats, setChecklistStats] = useState({ donePct: 0, sharedEq: 0 })
  const greeting = getGreeting()

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/campsites', { replace: true })
      return
    }

    async function loadData() {
      try {
        const tripData = await tripService.getTrips()
        if (tripData.success && Array.isArray(tripData.trips)) {
          setTrips(tripData.trips)
          
          const active = tripData.trips.filter(t => getTripCategory(t) !== 'past')

          // Load weather for nearest active trip
          if (active.length > 0) {
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            const sortedActive = [...active].sort((a, b) => {
              const dateA = a.startDate ? new Date(a.startDate) : new Date()
              const dateB = b.startDate ? new Date(b.startDate) : new Date()
              return Math.abs(dateA - now) - Math.abs(dateB - now)
            })

            const nearest = sortedActive[0]
            if (nearest) {
              setWeatherLoading(true)
              setWeatherError(null)
              try {
                const lat = nearest.coordinates?.lat
                const lng = nearest.coordinates?.lng
                const loc = nearest.location || nearest.name
                const wRes = await weatherService.getWeather(lat, lng, loc)
                if (wRes.success && wRes.weather) {
                  setWeatherData({
                    ...wRes.weather,
                    tripName: nearest.name,
                    tripLocation: nearest.location,
                  })
                } else {
                  setWeatherError(wRes.message || 'Weather unavailable')
                  setWeatherData(null)
                }
              } catch (wErr) {
                console.error('Failed to load weather for nearest trip:', wErr)
                setWeatherError('Failed to fetch weather')
                setWeatherData(null)
              } finally {
                setWeatherLoading(false)
              }
            }
          } else {
            setWeatherData(null)
          }

          let totalItems = 0
          let doneItems = 0
          let sharedEq = 0

          try {
            const groupPromises = active.map(t => checklistService.getGroupChecklist(t._id || t.id))
            const results = await Promise.allSettled(groupPromises)
            
            results.forEach(res => {
              if (res.status === 'fulfilled' && res.value?.groups) {
                res.value.groups.forEach(g => {
                  g.items?.forEach(item => {
                    totalItems++
                    if (item.done) doneItems++
                    if (item.assignedTo) sharedEq++
                  })
                })
              }
            })
            
            const donePct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
            setChecklistStats({ donePct, sharedEq })
          } catch (err) {
            console.error('Failed to load checklist stats:', err)
          }
        }
      } catch (err) {
        console.error('Failed to load trips:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Exclude completed/past trips from active trips calculations
  const activeTrips = trips.filter(t => getTripCategory(t) !== 'past')
  const activeTripsCount = activeTrips.length
  const totalParticipants = activeTrips.reduce((acc, t) => acc + (t.participants?.length || t.people || 1), 0)

  const userName = user?.name || 'Adventurer'

  return (
    <main className="app-shell">
      <AppSidebar />
      <section className="app-content">
        <AppHeader />
        <div className="dashboard-page">
          <section className="dashboard-welcome">
            <div>
              <h2>{greeting}, {userName}</h2>
              <p>You have {activeTripsCount} active camping trip{activeTripsCount !== 1 ? 's' : ''}.</p>
            </div>
            <p className="next-trip">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              <br />
              <b>Ready for your next journey</b>
            </p>
          </section>

          <section className="stats-grid">
            <StatCard icon={<FaRegCompass />} label="Active Trips" value={String(activeTripsCount)} detail="Upcoming & Ongoing" />
            <StatCard icon={<FaUsers />} label="Participants" value={String(totalParticipants)} detail="across active trips" tone="blue" />
            <StatCard icon={<FaRegListAlt />} label="Checklist Done" value={`${checklistStats.donePct}%`} detail="Items completed" tone="peach" />
            <StatCard icon={<FaCheckCircle />} label="Shared Equipment" value={String(checklistStats.sharedEq)} detail="Assigned gear" tone="yellow" />
          </section>

          <section className={`dashboard-grid ${activeTrips.length === 0 || (!weatherData && !weatherLoading && !weatherError) ? 'no-weather' : ''}`}>
            {activeTrips.length > 0 && (
              <>
                {weatherLoading && (
                  <article className="weather-card animate-pulse">
                    <div className="weather-top">
                      <span className="h-4 bg-emerald-800/40 rounded w-28"></span>
                      <FaCloudSun className="text-emerald-700 opacity-50" />
                    </div>
                    <strong className="text-2xl opacity-50">--<sup>°</sup><small>C</small></strong>
                    <p className="text-xs text-gray-400">Loading trip weather...</p>
                  </article>
                )}

                {!weatherLoading && weatherError && (
                  <article className="weather-card border border-amber-900/30 min-w-0 max-w-full">
                    <div className="weather-top flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-200 truncate">Weather Notice</span>
                      <FaExclamationTriangle className="text-amber-400 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-300 mt-2 break-words max-w-full m-0">{weatherError}</p>
                  </article>
                )}

                {!weatherLoading && weatherData && (
                  <article className="weather-card">
                    <div className="weather-top">
                      <span>{weatherData.tripLocation || weatherData.name || 'Camping Location'}</span>
                      <WeatherIcon condition={weatherData.condition} className="text-amber-300 text-lg" />
                    </div>
                    <strong>
                      {weatherData.temp}<sup>°</sup><small>C</small>
                    </strong>
                    <p className="capitalize">{weatherData.description || weatherData.condition} · {weatherData.tripName || 'Nearest trip'}</p>
                    <div className="weather-metrics">
                      <span><FaUmbrella className="inline mr-1 text-emerald-400" /> <b>{weatherData.rainProbability || 0}%</b><small>Rain Chance</small></span>
                      <span><FaWind className="inline mr-1 text-emerald-400" /> <b>{weatherData.windSpeed}</b><small>km/h Wind</small></span>
                      <span><FaTint className="inline mr-1 text-emerald-400" /> <b>{weatherData.humidity}%</b><small>Humidity</small></span>
                    </div>
                    {weatherData.forecast && weatherData.forecast.length > 0 && (
                      <div className="forecast-row">
                        {weatherData.forecast.map((item) => (
                          <span key={item.day} className="flex flex-col items-center">
                            <small>{item.day}</small>
                            <WeatherIcon condition={item.condition} className="my-1 text-sm text-amber-300" />
                            <b>{item.temp}°</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                )}
              </>
            )}


            <section className="upcoming-panel bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="panel-heading flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 m-0">Upcoming Trips</h2>
                  <p className="text-xs text-gray-500 mt-0.5 m-0">Your active adventures</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/trips')}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200/60 cursor-pointer"
                >
                  <span>View all</span>
                  <span className="group-hover:translate-x-0.5 transition-transform text-sm leading-none">›</span>
                </button>
              </div>

              {loading ? (
                <p className="p-4 text-center text-gray-500 text-xs font-medium">Loading trips...</p>
              ) : activeTrips.length === 0 ? (
                <div className="empty-trips-card p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
                  <p className="text-xs text-gray-500 m-0">No active upcoming trips right now.</p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    onClick={() => navigate('/trips/new')}
                  >
                    + Create a New Trip
                  </button>
                </div>
              ) : (
                <div className="upcoming-list space-y-3">
                  {activeTrips.map((trip) => (
                    <UpcomingTrip key={trip._id || trip.id || trip.name} trip={trip} />
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </section>
      <MobileNav />
    </main>
  )
}
