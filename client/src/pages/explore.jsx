import { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaPlus, FaTimes, FaThLarge, FaMapMarkedAlt } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { campsiteService } from '../services/campsiteService'
import GeoapifyMap from '../components/common/GeoapifyMap'
import { getImageUrl } from '../utils/imageUtils'

export default function Explore() {
  const [search, setSearch] = useState('')
  const [campsites, setCampsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'map'

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

  // Format markers for GeoapifyMap
  const mapMarkers = filteredCampsites.map(item => ({
    id: item._id || item.id,
    title: item.name,
    subtitle: item.location,
    description: item.description,
    image: item.image,
    lat: item.coordinates?.lat || 7.8731,
    lng: item.coordinates?.lng || 80.7718,
    link: `/explore/${item._id || item.id}`,
    type: 'campsite',
  }))

  return (
    <ScreenLayout title="Explore Camp Sites">
      <div className="screen-page explore-page">
        <div className="explore-search flex items-center gap-3">
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

          {/* Grid vs Map Toggle */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border-0 cursor-pointer ${
                viewMode === 'grid'
                  ? '!bg-emerald-700 !text-white shadow-sm'
                  : '!bg-transparent !text-gray-600 hover:!text-emerald-800 hover:!bg-emerald-50'
              }`}
            >
              <FaThLarge className="text-xs" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border-0 cursor-pointer ${
                viewMode === 'map'
                  ? '!bg-emerald-700 !text-white shadow-sm'
                  : '!bg-transparent !text-gray-600 hover:!text-emerald-800 hover:!bg-emerald-50'
              }`}
            >
              <FaMapMarkedAlt className="text-xs" /> Map
            </button>
          </div>
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
        ) : viewMode === 'map' ? (
          <div className="my-4">
            <GeoapifyMap
              height="550px"
              markers={mapMarkers}
              zoom={8}
              showStyleSelector={true}
            />
          </div>
        ) : (
          <div className="campsite-grid">
            {filteredCampsites.map((campsite) => (
              <ExploreCampsiteCard key={campsite._id || campsite.id} campsite={campsite} />
            ))}
          </div>
        )}
      </div>
    </ScreenLayout>
  )
}

function ExploreCampsiteCard({ campsite }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const campsiteId = campsite._id || campsite.id
  const images = campsite.images && campsite.images.length > 0 ? campsite.images : [campsite.image]
  const currentImg = images[photoIndex] || campsite.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'

  const nextPhoto = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setPhotoIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const prevPhoto = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setPhotoIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
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
    <article className="campsite-card group">
      <div className="campsite-image relative overflow-hidden">
        <img src={getImageUrl(currentImg)} alt={campsite.name} />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-emerald-700 text-white flex items-center justify-center backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity z-10 text-xs cursor-pointer"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-emerald-700 text-white flex items-center justify-center backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity z-10 text-xs cursor-pointer"
            >
              <FaChevronRight />
            </button>
            <span className="absolute bottom-2 right-2 bg-black/65 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
              {photoIndex + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      <div className="campsite-info">
        <h2>{campsite.name}</h2>
        <p className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
          <FaMapMarkerAlt className="shrink-0 text-emerald-600/80 text-xs" />
          <span>{campsite.location}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {formatTags(campsite.tags).map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100/80">
              #{tag}
            </span>
          ))}
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
}

