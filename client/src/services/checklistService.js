import api from '../lib/api'

export const checklistService = {
  // Shared Group Equipment Checklist APIs
  async getGroupChecklist(tripId) {
    const response = await api.get(`/checklists/group/${tripId}`)
    return response.data
  },

  async addGroupChecklistItem(tripId, itemData) {
    const response = await api.post(`/checklists/group/${tripId}/item`, itemData)
    return response.data
  },

  async editGroupItem(tripId, itemId, itemData) {
    const response = await api.put(`/checklists/group/${tripId}/item/${itemId}`, itemData)
    return response.data
  },

  async toggleGroupItem(tripId, itemId, completed) {
    const response = await api.patch(`/checklists/group/${tripId}/item/${itemId}`, { completed })
    return response.data
  },

  async assignEquipment(tripId, itemId, assignedTo) {
    const response = await api.post(`/checklists/group/${tripId}/item/${itemId}/assign`, { assignedTo })
    return response.data
  },

  async deleteGroupItem(tripId, itemId) {
    const response = await api.delete(`/checklists/group/${tripId}/item/${itemId}`)
    return response.data
  },
}
