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

  async getInviteByCode(code) {
    const response = await api.get(`/invitations/code/${code}`)
    return response.data
  },

  async acceptByCode(code) {
    const response = await api.post(`/invitations/code/${code}`)
    return response.data
  },

  async deleteInvitation(id) {
    const response = await api.delete(`/invitations/${id}`)
    return response.data
  },

  async clearRespondedInvitations() {
    const response = await api.delete('/invitations/clear/responded')
    return response.data
  },
}

