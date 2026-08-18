import { useEffect, useState } from 'react'
import { FaHeart, FaMapMarkerAlt, FaPlus, FaTimes } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { campsiteService } from '../services/campsiteService'

export default function Explore() {
  const [search, setSearch] = useState('')
  const [campsites, setCampsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTag, setSelectedTag] = useState('All')

  const fetchCampsites = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await campsiteService.getCampsites(search)
      if (data && data.success && Array.isArray(data.campsites)) {
        setCampsites(data.campsites)
      } else {
        setError(data?.message || 'Failed to load campsites from database.')
        setCampsites([])
      }
    } catch (err) {
      console.error('Error loading campsites:', err)
      setError(err.response?.data?.message || err.message || 'Could not connect to backend server.')
      setCampsites([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampsites()
  }, [search])

  const filteredCampsites = campsites.filter(item => {
    // 1. Tag filter matching (smart keyword matching)
    const matchesTag = selectedTag === 'All' || item.tags?.some(tag => {
      const t = tag.toLowerCase()
      const s = selectedTag.toLowerCase()
      if (t.includes(s) || s.includes(t)) return true
      if (s === 'mountain') return t.includes('highland') || t.includes('peak') || t.includes('ridge') || t.includes('cliff')
      if (s === 'forest') return t.includes('forest') || t.includes('jungle') || t.includes('rainforest') || t.includes('pygmy')
      if (s === 'river') return t.includes('river') || t.includes('stream') || t.includes('water') || t.includes('rapids') || t.includes('villu') || t.includes('lagoon')
      if (s === 'historical') return t.includes('ancient') || t.includes('citadel') || t.includes('heritage') || t.includes('sacred')
      return false
    })

    // 2. Search query filter (instant matching)
    if (!search.trim()) return matchesTag
    const query = search.toLowerCase().trim()
    const matchesSearch =
      item.name?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query))

    return matchesTag && matchesSearch
  })

  return (
    <ScreenLayout title="Explore Camp Sites">
      <div className="screen-page explore-page">
        <div className="explore-search">
          <label className="relative flex-1">
            <FiSearch />
            <input
              placeholder="Search campsites, parks, regions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent p-1 cursor-pointer"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </label>
        </div>

        <div className="filter-pills">
          {['All', 'Mountain', 'Forest', 'River', 'Highland', 'Grassland', 'Wilderness', 'Historical'].map((tag) => (
            <button
              key={tag}
              className={selectedTag === tag ? 'selected' : ''}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="list-title">
          <b>{filteredCampsites.length} campsite{filteredCampsites.length !== 1 ? 's' : ''} found</b>
          <span />
        </div>

        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading campsites...</p>
        ) : error ? (
          <div className="error-state p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl my-6 space-y-3">
            <p className="text-rose-700 font-bold text-sm">Failed to load campsites from backend server</p>
            <p className="text-xs text-rose-500">{error}</p>
            <button
              type="button"
              onClick={fetchCampsites}
              className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredCampsites.length === 0 ? (
          <div className="empty-state p-12 text-center text-gray-400 border border-dashed rounded-2xl border-emerald-800/40 my-6 space-y-2">
            <p className="text-gray-300 font-medium">No campsites found{search ? ` matching "${search}"` : ''}{selectedTag !== 'All' ? ` under "${selectedTag}"` : ''}</p>
            <p className="text-xs text-gray-500">Try selecting "All" or searching for terms like "Highland", "Forest", "Yahangala", or "Wangedigala".</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="px-4 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              {selectedTag !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedTag('All')}
                  className="px-4 py-1.5 bg-gray-700 text-white font-bold text-xs rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Show All Categories
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="campsite-grid">
            {filteredCampsites.map((campsite) => {
              const campsiteId = campsite._id || campsite.id
              return (
                <article className="campsite-card" key={campsiteId}>
                  <div className="campsite-image">
                    <img src={campsite.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'} alt={campsite.name} />
                    <button aria-label="Save campsite"><FaHeart /></button>
                  </div>
                  <div className="campsite-info">
                    <h2>{campsite.name}</h2>
                    <p><FaMapMarkerAlt /> {campsite.location} · {campsite.distance || 'Nearby'}</p>
                    <div>
                      {(campsite.tags || []).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      <Link to={`/explore/${campsiteId}`} className="text-xs font-semibold text-emerald-700 hover:underline">
                        View campsite →
                      </Link>
                      <Link
                        to={`/trips/new?campsite=${encodeURIComponent(campsite.name)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white !text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
                      >
                        <FaPlus className="text-[10px]" /> Plan Trip
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </ScreenLayout>
  )
}
