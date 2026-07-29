import api from '../lib/api'

export const campsiteService = {
  async getCampsites(searchQuery = '') {
    const response = await api.get('/campsites', { params: { search: searchQuery } })
    return response.data
  },

  async getCampsiteById(id) {
    const response = await api.get(`/campsites/${id}`)
    return response.data
  },

  async getWeather(lat = 7.3, lon = 80.8, query = '') {
    try {
      const response = await api.get('/weather', { params: { lat, lon, q: query } })
      return response.data
    } catch (error) {
      console.error('Weather API failed:', error)
      return { success: false, weather: null }
    }
  },
}
