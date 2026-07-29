import api from '../lib/api'

export const checklistService = {
  // Personal Checklist APIs
  async getPersonalChecklist() {
    const response = await api.get('/checklists/personal')
    return response.data
  },

  async addPersonalItem(itemData) {
    const response = await api.post('/checklists/personal', itemData)
    return response.data
  },

  async togglePersonalItem(itemId, completed) {
    const response = await api.patch(`/checklists/personal/${itemId}`, { completed })
    return response.data
  },

  async deletePersonalItem(itemId) {
    const response = await api.delete(`/checklists/personal/${itemId}`)
    return response.data
  },

  // Shared Group Equipment Checklist APIs
  async getGroupChecklist(tripId) {
    const response = await api.get(`/trips/${tripId}/checklist`)
    return response.data
  },

  async addGroupChecklistItem(tripId, itemData) {
    const response = await api.post(`/trips/${tripId}/checklist`, itemData)
    return response.data
  },

  async assignEquipment(tripId, itemId, assignedTo) {
    const response = await api.post(`/trips/${tripId}/checklist/${itemId}/assign`, { assignedTo })
    return response.data
  },

  async toggleGroupItem(tripId, itemId, completed) {
    const response = await api.patch(`/trips/${tripId}/checklist/${itemId}`, { completed })
    return response.data
  },
}
