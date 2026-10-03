import { GEOAPIFY_API_KEY } from '../config/mapConfig'

const BASE_URL = 'https://api.geoapify.com/v1'

export const geoapifyService = {
  // Search location suggestions using Geoapify Autocomplete API
  async autocomplete(text, countryCode = 'lk') {
    if (!text || text.trim().length < 2) return []

    try {
      let url = `${BASE_URL}/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}`
      if (countryCode) {
        url += `&filter=countrycode:${countryCode}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch autocomplete suggestions')
      const data = await res.json()

      let results = (data.features || []).map((feature) => ({
        formatted: feature.properties.formatted || feature.properties.name,
        name: feature.properties.name || feature.properties.formatted,
        city: feature.properties.city || feature.properties.county || feature.properties.state || '',
        country: feature.properties.country || '',
        lat: feature.properties.lat,
        lng: feature.properties.lon,
        raw: feature.properties,
      }))

      if (results.length === 0 && countryCode) {
        const fallbackUrl = `${BASE_URL}/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}`
        const fallbackRes = await fetch(fallbackUrl)
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          results = (fallbackData.features || []).map((feature) => ({
            formatted: feature.properties.formatted || feature.properties.name,
            name: feature.properties.name || feature.properties.formatted,
            city: feature.properties.city || feature.properties.county || feature.properties.state || '',
            country: feature.properties.country || '',
            lat: feature.properties.lat,
            lng: feature.properties.lon,
            raw: feature.properties,
          }))
        }
      }

      return results
    } catch (err) {
      console.error('Geoapify Autocomplete Error:', err)
      return []
    }
  },

  // Reverse geocode lat/lng coordinates to a readable address
  async reverseGeocode(lat, lng) {
    if (!lat || !lng) return null

    try {
      const url = `${BASE_URL}/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to reverse geocode')
      const data = await res.json()

      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties
        return {
          formatted: props.formatted,
          name: props.name || props.street || props.suburb || props.city,
          city: props.city || props.county || props.state,
          country: props.country,
          lat,
          lng,
        }
      }
      return null
    } catch (err) {
      console.error('Geoapify Reverse Geocode Error:', err)
      return null
    }
  },

  // Calculate driving or walking route & distance using Geoapify Routing API
  async calculateRoute(origin, destination, mode = 'drive') {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) return null

    try {
      const waypoints = `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`
      const url = `${BASE_URL}/routing?waypoints=${waypoints}&mode=${mode}&apiKey=${GEOAPIFY_API_KEY}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to calculate route')
      const data = await res.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const props = feature.properties

        // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon] array
        let coordinates = []
        if (feature.geometry?.type === 'LineString') {
          coordinates = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon])
        } else if (feature.geometry?.type === 'MultiLineString') {
          coordinates = feature.geometry.coordinates.flatMap(line => line.map(([lon, lat]) => [lat, lon]))
        }

        return {
          distanceKm: (props.distance / 1000).toFixed(1),
          distanceMeters: props.distance,
          durationMin: Math.round(props.time / 60),
          durationFormatted: props.time > 3600
            ? `${Math.floor(props.time / 3600)} hr ${Math.round((props.time % 3600) / 60)} min`
            : `${Math.round(props.time / 60)} min`,
          coordinates,
        }
      }
      return null
    } catch (err) {
      console.error('Geoapify Routing Error:', err)
      return null
    }
  },

  // Fetch nearby POIs (hospitals, gear shops, parks) around coordinates
  async getNearbyPlaces(lat, lng, categories = 'camping,leisure.park,service.financial,healthcare', radiusMeters = 15000) {
    if (!lat || !lng) return []

    try {
      const url = `${BASE_URL}/places?categories=${categories}&filter=circle:${lng},${lat},${radiusMeters}&bias=proximity:${lng},${lat}&limit=20&apiKey=${GEOAPIFY_API_KEY}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch nearby places')
      const data = await res.json()

      return (data.features || []).map(feature => {
        const props = feature.properties
        return {
          id: props.place_id,
          name: props.name || props.address_line1 || 'Points of Interest',
          category: props.categories?.[0] || 'place',
          categories: props.categories || [],
          address: props.formatted || props.address_line2 || '',
          distanceMeters: props.distance,
          distanceKm: props.distance ? (props.distance / 1000).toFixed(1) : null,
          lat: props.lat,
          lng: props.lon,
          raw: {
            contact: props.contact || props.datasource?.raw?.contact || null,
          },
        }
      })
    } catch (err) {
      console.error('Geoapify Places Error:', err)
      return []
    }
  },

  // Haversine formula to compute direct straight-line distance in KM
  getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
    const R = 6371
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return parseFloat((R * c).toFixed(1))
  },
}
