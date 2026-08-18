import axios from 'axios'

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL
  if (!url) return '/api'
  url = url.trim().replace(/\/+$/, '')
  if (!url.endsWith('/api')) {
    url = `${url}/api`
  }
  return url
}

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
