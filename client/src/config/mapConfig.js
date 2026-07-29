export const mapConfig = {
  apiKey: import.meta.env.VITE_MAP_API_KEY || '',
  provider: 'google', // Options: 'google' | 'mapbox' | 'leaflet'
  defaultCenter: {
    lat: 7.8731, // Default Sri Lanka Center
    lng: 80.7718,
  },
  defaultZoom: 9,
}
