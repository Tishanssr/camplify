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

  async createCampsite(data) {
    const isFormData = data instanceof FormData
    const response = await api.post('/campsites', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    })
    return response.data
  },

  async updateCampsite(id, data) {
    const isFormData = data instanceof FormData
    const response = await api.put(`/campsites/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    })
    return response.data
  },

  async deleteCampsite(id) {
    const response = await api.delete(`/campsites/${id}`)
    return response.data
  },
}

