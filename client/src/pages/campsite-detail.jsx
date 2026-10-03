import { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaUmbrella, FaWind, FaTint, FaExclamationTriangle, FaCloudSun } from 'react-icons/fa'
import { Link, useParams } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { campsiteService } from '../services/campsiteService'
import { weatherService } from '../services/weatherService'
import GeoapifyMap from '../components/common/GeoapifyMap'
import NearbyPlacesWidget from '../components/common/NearbyPlacesWidget'
import WeatherIcon from '../components/common/WeatherIcon'
import { getImageUrl } from '../utils/imageUtils'

export default function CampsiteDetail() {
  const { campsiteId } = useParams()
  const [site, setSite] = useState(null)
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    async function loadCampsite() {
      if (!campsiteId) return
      setLoading(true)
      try {
        const data = await campsiteService.getCampsiteById(campsiteId)
        if (data.success && data.campsite) {
          setSite(data.campsite)

          // Load live weather for this campsite destination
          setWeatherLoading(true)
          setWeatherError(null)
          try {
            const lat = data.campsite.coordinates?.lat || data.campsite.lat
            const lng = data.campsite.coordinates?.lng || data.campsite.lon || data.campsite.lng
            const wData = await weatherService.getWeather(lat, lng, data.campsite.location)
            if (wData.success && wData.weather) {
              setWeather(wData.weather)
            } else {
              setWeatherError(wData.message || 'Weather unavailable')
              setWeather(null)
            }
          } catch (wErr) {
            console.error('Failed to load campsite weather:', wErr)
            setWeatherError('Failed to fetch weather')
            setWeather(null)
          } finally {
            setWeatherLoading(false)
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

  const lat = site.coordinates?.lat || site.lat || 7.8731
  const lng = site.coordinates?.lng || site.lng || site.lon || 80.7718

  const campsiteMarker = [{
    id: site._id || site.id,
    title: site.name,
    subtitle: site.location,
    lat,
    lng,
    type: 'campsite',
  }]

  const photos = site.images && site.images.length > 0
    ? site.images
    : [site.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85']

  const currentPhoto = photos[activeImageIndex] || photos[0]

  const handlePrevPhoto = (e) => {
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const handleNextPhoto = (e) => {
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  const formatTags = (rawTags) => {
    let list = []
    if (Array.isArray(rawTags)) {
      list = rawTags.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
    } else if (typeof rawTags === 'string' && rawTags.trim()) {
      try {
        const parsed = JSON.parse(rawTags)
        if (Array.isArray(parsed)) {
          list = parsed.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
        } else {
          list = rawTags.split(',').map((t) => t.trim()).filter(Boolean)
        }
      } catch {
        list = rawTags.split(',').map((t) => t.trim()).filter(Boolean)
      }
    }
    return list.length > 0 ? list : ['Camping']
  }

  return (
    <ScreenLayout title={site.name}>
      <div className="detail-page">
        {/* Interactive Photo Carousel Hero */}
        <section
          className="campsite-hero transition-all duration-300 relative group overflow-hidden"
          style={{ backgroundImage: `linear-gradient(0deg, rgba(5,23,10,.75), transparent 60%), url(${getImageUrl(currentPhoto)})` }}
        >
          {/* Photo Counter Badge */}
          {photos.length > 1 && (
            <span className="absolute top-5 left-5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-md z-10">
              Photo {activeImageIndex + 1} of {photos.length}
            </span>
          )}

          {/* Arrow Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                aria-label="Previous photo"
                className="campsite-hero-arrow prev-arrow"
              >
                <FaChevronLeft className="text-sm" />
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                aria-label="Next photo"
                className="campsite-hero-arrow next-arrow"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs text-gray-200 mb-1">
              <FaMapMarkerAlt className="shrink-0 text-emerald-400" />
              <span>{site.location}</span>
            </p>
            <h1>{site.name}</h1>
            <span>{site.distance || 'Nearby'}</span>
          </div>
        </section>

        {/* Thumbnail Selector Row */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2 scrollbar-none">
            {photos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                  activeImageIndex === idx ? 'border-emerald-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={getImageUrl(url)} alt={`${site.name} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="detail-grid">
          <div className="space-y-6 min-w-0 w-full">
            <section className="detail-card">
              <h2>About this campsite</h2>
              <p>{site.description || site.about || `Explore ${site.name} located in ${site.location}. Ideal for camping, group hikes, and outdoor nature adventures.`}</p>
              <div className="site-tags">
                {formatTags(site.tags).map((tag, idx) => <span key={idx}>#{tag}</span>)}
              </div>
            </section>

            {/* Geoapify Interactive Map */}
            <section className="detail-card !p-0 overflow-hidden min-w-0 w-full">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="!m-0 text-base font-bold text-gray-900 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-emerald-700" /> Interactive Map Location
                </h2>
                <span className="text-xs text-gray-500 font-mono">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
              </div>
              <GeoapifyMap
                center={[lat, lng]}
                zoom={12}
                height="320px"
                markers={campsiteMarker}
                className="!border-0 !rounded-none"
              />
            </section>

            {/* Geoapify Places & Amenities Widget */}
            <NearbyPlacesWidget lat={lat} lng={lng} />

            {weatherLoading ? (
              <section className="detail-card animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 bg-gray-200 rounded w-40"></div>
                  <FaCloudSun className="text-gray-300 text-lg" />
                </div>
                <p className="text-xs text-gray-400">Loading live campsite weather...</p>
              </section>
            ) : weatherError ? (
              <section className="detail-card border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                  <FaExclamationTriangle className="text-amber-600" />
                  <span>Weather unavailable: {weatherError}</span>
                </div>
              </section>
            ) : weather && (
              <section className="detail-card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="!m-0 text-base font-bold text-gray-900 flex items-center gap-2">
                    <WeatherIcon condition={weather.condition} className="text-amber-500 text-lg" />
                    Live Weather ({site.location})
                  </h2>
                  <span className="text-sm font-extrabold text-emerald-800">{weather.temp}°C</span>
                </div>

                <p className="text-xs text-gray-600 font-medium capitalize mb-3">
                  Current Condition: <b>{weather.description || weather.condition}</b>
                </p>

                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block flex items-center justify-center gap-1">
                      <FaUmbrella className="text-emerald-600 text-[10px]" /> Rain
                    </span>
                    <b className="text-xs text-gray-800">{weather.rainProbability || 0}%</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block flex items-center justify-center gap-1">
                      <FaWind className="text-emerald-600 text-[10px]" /> Wind
                    </span>
                    <b className="text-xs text-gray-800">{weather.windSpeed} km/h</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block flex items-center justify-center gap-1">
                      <FaTint className="text-emerald-600 text-[10px]" /> Humidity
                    </span>
                    <b className="text-xs text-gray-800">{weather.humidity}%</b>
                  </div>
                </div>

                {weather.forecast && weather.forecast.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">5-Day Forecast</h3>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {weather.forecast.map((f, i) => (
                        <div key={i} className="flex-1 min-w-[65px] p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-gray-500 block">{f.day}</span>
                          <div className="my-1 flex justify-center">
                            <WeatherIcon condition={f.condition} className="text-sm text-amber-500" />
                          </div>
                          <b className="text-xs text-gray-800">{f.temp}°C</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="min-w-0 w-full">
            <section className="detail-card map-card">
              <h2>Location</h2>
              <p className="flex items-center gap-1.5 text-gray-600 text-xs my-2">
                <FaMapMarkerAlt className="shrink-0 text-emerald-600 text-sm" />
                <span>{site.location}</span>
              </p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noreferrer">
                Open in external maps →
              </a>
            </section>

            <section className="detail-card">
              <h2>Plan a trip here</h2>
              <p>Create a group trip for {site.name} and invite your camping crew.</p>
              <Link
                className="new-trip-button inline-flex items-center justify-center gap-1.5 w-full mt-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                to={`/trips/new?campsite=${encodeURIComponent(site.name)}`}
              >
                ＋ Create Trip
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </ScreenLayout>
  )
}

