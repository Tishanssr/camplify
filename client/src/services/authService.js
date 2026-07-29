import api from '../lib/api'

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
    }
  },

  async checkAuth() {
    const response = await api.get('/auth/is-auth')
    return response.data
  },

  async getUserProfile() {
    const response = await api.get('/user/data')
    return response.data
  },

  async sendVerifyOtp() {
    const response = await api.post('/auth/send-verify-otp')
    return response.data
  },

  async verifyAccount(otp) {
    const response = await api.post('/auth/verify-account', { otp })
    return response.data
  },

  async sendResetOtp(email) {
    const response = await api.post('/auth/send-reset-otp', { email })
    return response.data
  },

  async resetPassword(email, otp, newPassword) {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword })
    return response.data
  },
}
