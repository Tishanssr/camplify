import { useEffect, useState } from 'react'
import { FaCheckCircle, FaCloudSun, FaRegCompass, FaRegListAlt, FaUsers } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader'
import AppSidebar from '../components/layout/AppSidebar'
import MobileNav from '../components/layout/MobileNav'
import StatCard from '../components/dashboard/StatCard'
import UpcomingTrip from '../components/dashboard/UpcomingTrip'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import { campsiteService } from '../services/campsiteService'
import { checklistService } from '../services/checklistService'
import { getTripCategory } from '../utils/dateUtils'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [weatherData, setWeatherData] = useState(null)
  const [checklistStats, setChecklistStats] = useState({ donePct: 0, sharedEq: 0 })

  useEffect(() => {
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
              try {
                const lat = nearest.coordinates?.lat
                const lng = nearest.coordinates?.lng
                const loc = nearest.location || nearest.name
                const wRes = await campsiteService.getWeather(lat, lng, loc)
                if (wRes.success && wRes.weather) {
                  setWeatherData({
                    ...wRes.weather,
                    tripName: nearest.name,
                    tripLocation: nearest.location,
                  })
                } else {
                  setWeatherData(null)
                }
              } catch (wErr) {
                console.error('Failed to load weather for nearest trip:', wErr)
                setWeatherData(null)
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
            const results = await Promise.allSettled([...groupPromises, checklistService.getPersonalChecklist()])
            
            results.forEach(res => {
              if (res.status === 'fulfilled') {
                if (res.value?.groups) {
                  res.value.groups.forEach(g => {
                    g.items?.forEach(item => {
                      totalItems++
                      if (item.done) doneItems++
                      if (item.assignedTo) sharedEq++
                    })
                  })
                }
                if (res.value?.items) {
                  res.value.items.forEach(item => {
                    totalItems++
                    if (item.done) doneItems++
                  })
                }
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
              <h2>Good morning, {userName} <span>☀</span></h2>
              <p>You have {activeTripsCount} active camping trip{activeTripsCount !== 1 ? 's' : ''}.</p>
            </div>
            <p className="next-trip">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              <br />
              <b>Ready for your next journey</b>
            </p>
          </section>

          <section className="stats-grid">
            <StatCard icon={<FaRegCompass />} label="Active Trips" value={String(activeTripsCount)} detail="Upcoming & Planning" />
            <StatCard icon={<FaUsers />} label="Participants" value={String(totalParticipants)} detail="across active trips" tone="blue" />
            <StatCard icon={<FaRegListAlt />} label="Checklist Done" value={`${checklistStats.donePct}%`} detail="Items completed" tone="peach" />
            <StatCard icon={<FaCheckCircle />} label="Shared Equipment" value={String(checklistStats.sharedEq)} detail="Assigned gear" tone="yellow" />
          </section>

          <section className={`dashboard-grid ${activeTrips.length === 0 || !weatherData ? 'no-weather' : ''}`}>
            {activeTrips.length > 0 && weatherData && (
              <article className="weather-card">
                <div className="weather-top">
                  <span>{weatherData.tripLocation || weatherData.name || 'Camping Location'}</span>
                  <FaCloudSun />
                </div>
                <strong>
                  {weatherData.temp}<sup>°</sup><small>C</small>
                </strong>
                <p className="capitalize">{weatherData.condition} · {weatherData.tripName || 'Nearest trip'}</p>
                <div className="weather-metrics">
                  <span>☔ <b>{weatherData.rainProbability || 0}%</b><small>Rain</small></span>
                  <span>↗ <b>{weatherData.windSpeed}</b><small>km/h Wind</small></span>
                  <span>💧 <b>{weatherData.humidity}%</b><small>Humidity</small></span>
                </div>
                {weatherData.forecast && weatherData.forecast.length > 0 && (
                  <div className="forecast-row">
                    {weatherData.forecast.map((item) => (
                      <span key={item.day}>
                        <small>{item.day}</small>
                        <b>{item.condition === 'Clear' ? '☀' : item.condition === 'Rain' ? '🌧' : '🌤'}</b>
                        <b>{item.temp}°</b>
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )}

            <section className="upcoming-panel">
              <div className="panel-heading">
                <div>
                  <h2>Upcoming Trips</h2>
                  <p>Your active adventures</p>
                </div>
                <button onClick={() => navigate('/trips')}>View all <span>›</span></button>
              </div>

              {loading ? (
                <p className="p-4 text-center text-gray-500">Loading trips...</p>
              ) : activeTrips.length === 0 ? (
                <div className="empty-trips-card p-6 text-center border border-dashed rounded-xl border-emerald-800/40">
                  <p className="text-gray-400 mb-3">No active upcoming trips right now.</p>
                  <button className="primary-button" onClick={() => navigate('/trips/new')}>
                    + Create a New Trip
                  </button>
                </div>
              ) : (
                <div className="upcoming-list">
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
