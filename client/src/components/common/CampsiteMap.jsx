import { FaMapMarkerAlt, FaLocationArrow, FaCog } from 'react-icons/fa'
import { mapConfig } from '../../config/mapConfig'

export default function CampsiteMap({
  lat = mapConfig.defaultCenter.lat,
  lng = mapConfig.defaultCenter.lng,
  locationName = 'Campsite Location',
  onSelectLocation,
  height = '220px',
}) {
  const hasKey = Boolean(mapConfig.apiKey)

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-emerald-800/20 bg-emerald-950/40 shadow-inner flex flex-col justify-between p-4"
      style={{ height }}
    >
      {/* Background Map Graphic Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#347d3d_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-bold border border-emerald-700/40">
          <FaMapMarkerAlt /> {locationName}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${hasKey ? 'bg-emerald-500 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
          {hasKey ? 'Map API Connected' : 'Map API Plug & Play Ready'}
        </span>
      </div>

      <div className="relative z-10 text-center space-y-1 my-auto">
        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-700/40 text-emerald-300 flex items-center justify-center text-lg animate-bounce">
          <FaMapMarkerAlt />
        </div>
        <p className="text-xs font-bold text-gray-200">{locationName}</p>
        <p className="text-[11px] font-mono text-emerald-400">
          Lat: {lat.toFixed(4)}° N · Lng: {lng.toFixed(4)}° E
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-emerald-900/40">
        <span className="flex items-center gap-1">
          <FaLocationArrow className="text-emerald-500" /> Sri Lanka Region
        </span>
        {onSelectLocation && (
          <button
            type="button"
            className="text-emerald-300 font-bold hover:underline"
            onClick={() => onSelectLocation({ lat, lng, locationName })}
          >
            Pick Location →
          </button>
        )}
      </div>
    </div>
  )
}
