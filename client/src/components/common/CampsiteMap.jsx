import { useEffect, useState } from 'react'
import GeoapifyMap from './GeoapifyMap'
import { mapConfig } from '../../config/mapConfig'
import { geoapifyService } from '../../services/geoapifyService'

export default function CampsiteMap({
  lat,
  lng,
  locationName = 'Campsite Location',
  onSelectLocation,
  height = '240px',
  zoom = 12,
}) {
  const [coords, setCoords] = useState(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0) {
      return { lat, lng }
    }
    return null
  })

  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0) {
      setCoords({ lat, lng })
      return
    }

    // Dynamic Geoapify geocoding lookup if coordinates are missing or invalid
    if (locationName && locationName !== 'Campsite Location') {
      let isMounted = true
      geoapifyService.autocomplete(locationName).then((results) => {
        if (isMounted && results && results.length > 0 && results[0].lat && results[0].lng) {
          setCoords({ lat: results[0].lat, lng: results[0].lng })
        }
      })
      return () => { isMounted = false }
    }
  }, [lat, lng, locationName])

  const markerLat = coords?.lat || mapConfig.defaultCenter[0]
  const markerLng = coords?.lng || mapConfig.defaultCenter[1]

  const markers = [
    {
      id: 'campsite-location',
      title: locationName,
      lat: markerLat,
      lng: markerLng,
      type: 'campsite',
    },
  ]

  return (
    <GeoapifyMap
      center={[markerLat, markerLng]}
      zoom={zoom}
      height={height}
      markers={markers}
      onMapClick={onSelectLocation}
    />
  )
}
