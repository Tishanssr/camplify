export const GEOAPIFY_API_KEY = import.meta.env.GEOAPIFY_API_KEY || import.meta.env.VITE_GEOAPIFY_API_KEY || ''

export const mapConfig = {
  apiKey: GEOAPIFY_API_KEY,
  provider: 'geoapify',
  defaultCenter: [7.8731, 80.7718], // Sri Lanka default center [lat, lng]
  defaultZoom: 8,
  styles: {
    osmBright: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    klokantechBasic: `https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    osmCarto: `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    fallback: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  attribution: '&copy; <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
}

