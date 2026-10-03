import api from '../lib/api'

// Simple in-memory cache with 10-minute TTL
const weatherCache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export const weatherService = {
  async getWeather(lat, lon, query = '') {
    const numLat = Number(lat)
    const numLon = Number(lon)
    const hasLat = lat !== undefined && lat !== null && lat !== '' && !isNaN(numLat)
    const hasLon = lon !== undefined && lon !== null && lon !== '' && !isNaN(numLon)

    const safeLat = hasLat ? numLat.toFixed(3) : ''
    const safeLon = hasLon ? numLon.toFixed(3) : ''
    const safeQuery = (query || '').trim().toLowerCase()

    const cacheKey = `${safeLat}_${safeLon}_${safeQuery}`
    const now = Date.now()

    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey)
      if (now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data
      }
      weatherCache.delete(cacheKey)
    }

    try {
      const params = {}
      if (hasLat) params.lat = numLat
      if (hasLon) params.lon = numLon
      if (safeQuery) params.q = query

      const response = await api.get('/weather', { params })
      if (response.data?.success) {
        weatherCache.set(cacheKey, {
          data: response.data,
          timestamp: now,
        })
      }
      return response.data

    } catch (error) {
      console.error('Weather API request failed:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch weather data',
      }
    }
  },

  clearCache() {
    weatherCache.clear()
  },
}
