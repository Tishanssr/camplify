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
  const [selectedTag, setSelectedTag] = useState('All')

  useEffect(() => {
    async function loadCampsites() {
      try {
        const data = await campsiteService.getCampsites(search)
        if (data.success && Array.isArray(data.campsites)) {
          setCampsites(data.campsites)
        } else {
          setCampsites([])
        }
      } catch {
        setCampsites([])
      } finally {
        setLoading(false)
      }
    }
    loadCampsites()
  }, [search])

  const filteredCampsites = campsites.filter(item => {
    // 1. Tag filter
    const matchesTag = selectedTag === 'All' || item.tags?.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase()))

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
          {['All', 'Mountain', 'Forest', 'River', 'Hiking', 'Historical'].map((tag) => (
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
        ) : filteredCampsites.length === 0 ? (
          <div className="empty-state p-12 text-center text-gray-400 border border-dashed rounded-2xl border-emerald-800/40 my-6 space-y-2">
            <p className="text-gray-300 font-medium">No campsites found matching "{search}"</p>
            <p className="text-xs text-gray-500">Try searching for keywords like "Mountain", "Forest", "Yahangala", or "Kalupahana".</p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 px-4 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition-colors"
              >
                Clear Search
              </button>
            )}
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg transition-colors"
                      >
                        <FaPlus className="text-[9px]" /> Plan Trip
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
