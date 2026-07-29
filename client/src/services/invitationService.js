import api from '../lib/api'

export const invitationService = {
  async getInvitations() {
    const response = await api.get('/invitations')
    return response.data
  },

  async respondInvitation(id, status) {
    const response = await api.post(`/invitations/${id}/respond`, { status })
    return response.data
  },

  async acceptByCode(code) {
    const response = await api.post(`/invitations/code/${code}`)
    return response.data
  },
}
