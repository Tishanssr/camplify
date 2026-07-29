import { useEffect, useState } from 'react'
import { FaHeart, FaMapMarkerAlt, FaStar } from 'react-icons/fa'
import { Link, useParams } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { campsiteService } from '../services/campsiteService'

export default function CampsiteDetail() {
  const { campsiteId } = useParams()
  const [site, setSite] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadCampsite() {
      if (!campsiteId) return
      setLoading(true)
      try {
        const data = await campsiteService.getCampsiteById(campsiteId)
        if (data.success && data.campsite) {
          setSite(data.campsite)

          // Load live weather for this campsite destination
          try {
            const wData = await campsiteService.getWeather(data.campsite.lat, data.campsite.lon, data.campsite.location)
            if (wData.success && wData.weather) {
              setWeather(wData.weather)
            }
          } catch (wErr) {
            console.error('Failed to load campsite weather:', wErr)
          }
        } else {
          setSite(null)
        }
      } catch (err) {
        console.error('Failed to load campsite details:', err)
        setSite(null)
      } finally {
        setLoading(false)
      }
    }
    loadCampsite()
  }, [campsiteId])

  if (loading) {
    return (
      <ScreenLayout title="Campsite Details">
        <div className="p-12 text-center text-gray-400">Loading campsite details...</div>
      </ScreenLayout>
    )
  }

  if (!site) {
    return (
      <ScreenLayout title="Campsite Details">
        <div className="p-12 text-center text-gray-400 border border-dashed rounded-2xl border-emerald-800/30 my-6">
          <p className="text-gray-300 font-medium">Campsite not found in database.</p>
          <Link to="/explore" className="text-xs text-emerald-700 font-bold hover:underline block mt-3">
            ← Return to Explore
          </Link>
        </div>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout title={site.name}>
      <div className="detail-page">
        <section
          className="campsite-hero"
          style={{ backgroundImage: `linear-gradient(0deg, rgba(5,23,10,.68), transparent 65%), url(${site.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'})` }}
        >
          <button className={saved ? 'saved' : ''} onClick={() => setSaved(v => !v)}>
            <FaHeart /> {saved ? 'Saved' : 'Save campsite'}
          </button>
          <div>
            <p><FaMapMarkerAlt /> {site.location}</p>
            <h1>{site.name}</h1>
            <span><FaStar /> {site.rating || 4.8} ({site.reviews || 0} reviews) · {site.distance || 'Nearby'}</span>
          </div>
        </section>

        <div className="detail-grid">
          <div>
            <section className="detail-card">
              <h2>About this campsite</h2>
              <p>{site.description || site.about || `Explore ${site.name} located in ${site.location}. Ideal for camping, group hikes, and outdoor nature adventures.`}</p>
              <div className="site-tags">
                {(site.tags || []).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </section>

            {weather && (
              <section className="detail-card">
                <h2>Live Weather ({weather.temp}°C · {weather.condition})</h2>
                <div className="detail-weather flex flex-wrap gap-3 mt-2">
                  {weather.forecast && weather.forecast.length > 0 ? (
                    weather.forecast.map((f, i) => (
                      <span key={i} className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/30 rounded-xl text-xs text-gray-200">
                        {f.day}: {f.temp}°C {f.condition}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Current temperature: {weather.temp}°C ({weather.condition})</span>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside>
            <section className="detail-card map-card">
              <h2>Location</h2>
              <div><FaMapMarkerAlt /></div>
              <p>{site.location}</p>
              <a href="#directions">Get directions →</a>
            </section>

            <section className="detail-card">
              <h2>Plan a trip here</h2>
              <p>Create a group trip for {site.name} and invite your camping crew.</p>
              <Link
                className="new-trip-button inline-flex items-center justify-center gap-1.5 w-full mt-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                to={`/trips/new?campsite=${encodeURIComponent(site.name)}`}
              >
                ＋ Create Trip for {site.name}
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </ScreenLayout>
  )
}
