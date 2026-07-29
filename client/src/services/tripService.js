import api from '../lib/api'

export const tripService = {
  async getTrips() {
    const response = await api.get('/trips')
    return response.data
  },

  async getTripById(id) {
    const response = await api.get(`/trips/${id}`)
    return response.data
  },

  async createTrip(tripData) {
    const response = await api.post('/trips', tripData)
    return response.data
  },

  async updateTrip(id, tripData) {
    const response = await api.put(`/trips/${id}`, tripData)
    return response.data
  },

  async deleteTrip(id) {
    const response = await api.delete(`/trips/${id}`)
    return response.data
  },

  async getInvitationByCode(inviteCode) {
    const response = await api.get(`/invitations/${inviteCode}`)
    return response.data
  },

  async respondToInvitation(inviteCode, accept) {
    const response = await api.post(`/invitations/${inviteCode}/respond`, { accept })
    return response.data
  },

  async inviteParticipant(tripId, email) {
    const response = await api.post(`/trips/${tripId}/invite`, { email })
    return response.data
  },
}
