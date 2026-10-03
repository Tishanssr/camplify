import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { mapConfig } from '../../config/mapConfig'
import { FaLayerGroup, FaExpand, FaLocationArrow, FaTimes, FaMapMarkerAlt } from 'react-icons/fa'

// Custom Leaflet DivIcon for crisp, dependency-free markers
const createCustomMarkerIcon = (type = 'campsite', isSelected = false) => {
  const size = isSelected ? 40 : 32
  const bgColor = type === 'user' ? '#3B82F6' : type === 'meeting' ? '#F59E0B' : '#059669'

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        background-color: ${bgColor};
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        transition: transform 0.2s ease, background-color 0.2s ease;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  })
}

// Component to force Leaflet container recalculation on layout mount/resize
function MapInvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    if (!container) return

    map.invalidateSize()

    let resizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })
      resizeObserver.observe(container)
    }

    const timer1 = setTimeout(() => map.invalidateSize(), 50)
    const timer2 = setTimeout(() => map.invalidateSize(), 250)
    const timer3 = setTimeout(() => map.invalidateSize(), 600)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.removeEventListener('resize', handleResize)
    }
  }, [map])
  return null
}

// Component to dynamically recenter map when center changes
function RecenterMap({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), { animate: false })
      map.invalidateSize()
    }
  }, [center, zoom, map])
  return null
}

// Component to catch map click events for location pickers
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({
          lat: parseFloat(e.latlng.lat.toFixed(6)),
          lng: parseFloat(e.latlng.lng.toFixed(6)),
        })
      }
    },
  })
  return null
}

export default function GeoapifyMap({
  center = mapConfig.defaultCenter,
  zoom = mapConfig.defaultZoom,
  markers = [],
  onMapClick,
  selectedMarkerId = null,
  height = '420px',
  interactive = true,
  className = '',
  showStyleSelector = true,
}) {
  const [currentStyle, setCurrentStyle] = useState('osmBright')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const validatedCenter = Array.isArray(center) && center.length === 2 && center[0] && center[1]
    ? center
    : mapConfig.defaultCenter

  const tileUrl = mapConfig.styles[currentStyle] || mapConfig.styles.osmBright

  const renderMapContent = () => (
    <MapContainer
      center={validatedCenter}
      zoom={zoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        attribution={mapConfig.attribution}
        url={tileUrl}
        maxZoom={19}
      />

      <RecenterMap center={validatedCenter} zoom={zoom} />
      <MapInvalidateSize />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

      {markers.map((marker) => {
        if (!marker.lat || !marker.lng) return null
        const isSelected = selectedMarkerId && (marker.id === selectedMarkerId || marker._id === selectedMarkerId)
        const icon = createCustomMarkerIcon(marker.type || 'campsite', isSelected)

        return (
          <Marker
            key={marker.id || marker._id || `${marker.lat}-${marker.lng}`}
            position={[marker.lat, marker.lng]}
            icon={icon}
            eventHandlers={{
              click: () => marker.onClick && marker.onClick(marker),
            }}
          >
            {(marker.title || marker.name || marker.description) && (
              <Popup className="custom-geoapify-popup">
                <div className="p-1 max-w-[220px]">
                  {marker.image && (
                    <img
                      src={marker.image}
                      alt={marker.title || marker.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">
                    {marker.title || marker.name}
                  </h4>
                  {marker.subtitle && (
                    <p className="text-xs text-emerald-700 font-medium mb-1">{marker.subtitle}</p>
                  )}
                  {marker.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{marker.description}</p>
                  )}
                  {marker.link && (
                    <a
                      href={marker.link}
                      className="inline-block w-full text-center py-1 px-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors text-decoration-none"
                    >
                      View Details →
                    </a>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        )
      })}
    </MapContainer>
  )

  const styleSelectorControls = showStyleSelector && (
    <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-200/80 flex items-center gap-1 text-xs font-medium">
      <span className="pl-2 pr-1 text-gray-400 flex items-center gap-1">
        <FaLayerGroup /> Style:
      </span>
      <button
        type="button"
        onClick={() => setCurrentStyle('osmBright')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-colors ${
          currentStyle === 'osmBright' ? 'bg-emerald-700 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-100'
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setCurrentStyle('klokantechBasic')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-colors ${
          currentStyle === 'klokantechBasic' ? 'bg-emerald-700 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-100'
        }`}
      >
        Outdoors
      </button>
    </div>
  )

  return (
    <>
      {/* Inline Map View */}
      <div
        className={`relative w-full max-w-full min-w-0 box-border overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all bg-white ${className}`}
        style={{ height }}
      >
        {renderMapContent()}

        {/* Floating Controls Overlay */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          {styleSelectorControls}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="self-end bg-white/95 hover:bg-white backdrop-blur-md p-2.5 rounded-xl shadow-md border border-gray-200/80 text-gray-700 hover:text-emerald-700 cursor-pointer transition-all flex items-center justify-center text-sm"
            title="Expand Map to Centered Modal"
          >
            <FaExpand />
          </button>
        </div>

        {onMapClick && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <FaLocationArrow className="text-emerald-600 animate-pulse" /> Click anywhere on map to select coordinates
          </div>
        )}
      </div>

      {/* Centered Pop-up Modal Window */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-all duration-200 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/90 border-b border-gray-200/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm">
                  <FaMapMarkerAlt />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 m-0 leading-tight">
                    Interactive Location Map
                  </h3>
                  <p className="text-[11px] text-gray-500 m-0">
                    Centered pop-up view • Press ESC to exit
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {styleSelectorControls}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 hover:text-gray-900 transition-colors border-0 cursor-pointer text-xs font-bold flex items-center gap-1.5"
                  title="Close Map View"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            {/* Modal Map Viewport */}
            <div className="relative flex-1 w-full h-full overflow-hidden">
              {renderMapContent()}

              {onMapClick && (
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-gray-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <FaLocationArrow className="text-emerald-600 animate-pulse" /> Click anywhere on map to select coordinates
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
