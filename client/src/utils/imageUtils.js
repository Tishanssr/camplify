// Resolve full image URL for local proxy paths (/api/images/...) or external links
export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string') return ''

  // Return as-is if already an absolute HTTP/HTTPS URL or data URI
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }

  // Extract backend origin (strip trailing /api or /api/)
  const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || ''
  const backendHost = rawApiUrl.replace(/\/api\/?$/, '')

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return backendHost ? `${backendHost}${cleanPath}` : cleanPath
}
