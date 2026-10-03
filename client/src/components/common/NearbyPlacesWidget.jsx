import { useEffect, useState } from 'react'
import { geoapifyService } from '../../services/geoapifyService'
import {
  FaStore,
  FaCompass,
  FaMapMarkerAlt,
  FaSpinner,
  FaHospital,
  FaGasPump,
  FaShoppingCart,
  FaExternalLinkAlt,
  FaPhoneAlt,
} from 'react-icons/fa'

const CATEGORY_MAP = {
  gear: {
    label: 'Camping & Outdoor Shops',
    categoryStr: 'commercial.outdoor_and_sport,sport,camping,commercial.shopping_mall',
    icon: FaStore,
  },
  supplies: {
    label: 'General Supplies & Stores',
    categoryStr: 'commercial.supermarket,commercial.marketplace',
    icon: FaShoppingCart,
  },
  fuel: {
    label: 'Fuel & Gas Stations',
    categoryStr: 'service.vehicle.fuel',
    icon: FaGasPump,
  },
  emergency: {
    label: 'Medical & Emergency',
    categoryStr: 'healthcare.hospital,healthcare.clinic',
    icon: FaHospital,
  },
  all: {
    label: 'All Services',
    categoryStr: 'commercial.outdoor_and_sport,camping,commercial.supermarket,service.vehicle.fuel,healthcare.hospital',
    icon: FaCompass,
  },
}

export default function NearbyPlacesWidget({ lat, lng, className = '' }) {
  const [activeTab, setActiveTab] = useState('gear') // Default to Camping & Outdoor Shops
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadPlaces() {
      if (!lat || !lng) return
      setLoading(true)
      const categoryStr = CATEGORY_MAP[activeTab]?.categoryStr || CATEGORY_MAP.gear.categoryStr
      const results = await geoapifyService.getNearbyPlaces(lat, lng, categoryStr, 20000)
      setPlaces(results)
      setLoading(false)
    }

    loadPlaces()
  }, [lat, lng, activeTab])

  if (!lat || !lng) return null

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-w-0 w-full box-border overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-base">
            <FaStore />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 m-0">
              Nearby Camping Equipment & Supply Shops
            </h3>
            <p className="text-xs text-gray-500 m-0">
              Locate outdoor gear, camping stores, and supplies powered by Geoapify
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {Object.entries(CATEGORY_MAP).map(([key, item]) => {
            const Icon = item.icon
            const isActive = activeTab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border-0 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="text-xs" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
          <FaSpinner className="animate-spin text-emerald-600 text-base" /> Finding outdoor shops & supplies nearby...
        </div>
      ) : places.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs border border-dashed rounded-xl border-gray-200">
          No nearby equipment shops or places found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {places.map((place, idx) => {
            const categoryDisplay = place.category
              ? place.category.replace(/^commercial\./, '').replace(/^service\./, '').replace(/\./g, ' › ')
              : 'Outdoor Supply'

            return (
              <div
                key={place.id || idx}
                className="p-3.5 bg-gray-50/90 hover:bg-emerald-50/60 rounded-xl border border-gray-100 transition-colors flex items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 truncate m-0">
                    {place.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 truncate m-0">
                    <FaMapMarkerAlt className="inline text-emerald-600 mr-1" />
                    {place.address || 'Address not listed'}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] uppercase font-bold tracking-wider">
                      ⛺ {categoryDisplay}
                    </span>

                    {place.raw?.contact?.phone && (
                      <a
                        href={`tel:${place.raw.contact.phone}`}
                        className="text-[10px] text-gray-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <FaPhoneAlt className="text-[9px]" /> {place.raw.contact.phone}
                      </a>
                    )}
                    {place.raw?.contact?.website && (
                      <a
                        href={place.raw.contact.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <FaExternalLinkAlt className="text-[8px]" /> Website
                      </a>
                    )}
                  </div>
                </div>

                {place.distanceKm && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-lg whitespace-nowrap">
                    {place.distanceKm} km
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
