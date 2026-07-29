import api from '../lib/api'

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications')
    return response.data
  },

  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all')
    return response.data
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },

  async clearAllNotifications() {
    const response = await api.delete('/notifications/clear-all')
    return response.data
  },
}
