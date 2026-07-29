const locationMap = {
  yahangala: { lat: 7.425, lon: 80.789, name: 'Yahangala Ground' },
  wangedigala: { lat: 6.782, lon: 80.841, name: 'Wangedigala Peak' },
  nuwaragala: { lat: 7.452, lon: 81.564, name: 'Nuwaragala Site' },
  knuckles: { lat: 7.375, lon: 80.75, name: 'Knuckles Range' },
  horton: { lat: 6.802, lon: 80.803, name: 'Horton Plains' },
  ella: { lat: 6.858, lon: 81.046, name: 'Ella Rock' },
  kandy: { lat: 7.29, lon: 80.633, name: 'Kandy' },
  udugumbara: { lat: 7.425, lon: 80.789, name: 'Udugumbara' },
  kalupahana: { lat: 6.782, lon: 80.841, name: 'Kalupahana' },
  ampara: { lat: 7.291, lon: 81.672, name: 'Ampara' },
  nuwara: { lat: 6.949, lon: 80.789, name: 'Nuwara Eliya' },
}

export const getWeather = async (req, res) => {
  try {
    const { lat, lon, q, location } = req.query
    const apiKey = process.env.OPENWEATHER_API_KEY || '365280cbdf8d7afbc956ee63c5a9b369'

    let targetLat = lat || 7.3
    let targetLon = lon || 80.8
    let queryLocation = q || location || ''

    // Check if location string matches our Sri Lanka campsite coordinates map
    if (queryLocation) {
      const queryKey = queryLocation.toLowerCase().trim()
      const matchedKey = Object.keys(locationMap).find((key) => queryKey.includes(key))

      if (matchedKey) {
        targetLat = locationMap[matchedKey].lat
        targetLon = locationMap[matchedKey].lon
        queryLocation = ''
      }
    }

    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${targetLat}&lon=${targetLon}&appid=${apiKey}&units=metric`
    let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${targetLat}&lon=${targetLon}&appid=${apiKey}&units=metric`

    if (queryLocation) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryLocation)},LK&appid=${apiKey}&units=metric`
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(queryLocation)},LK&appid=${apiKey}&units=metric`
    }

    const [currentRes, forecastRes] = await Promise.all([
      fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(forecastUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])

    if (!currentRes) {
      return res.json({
        success: false,
        message: 'Could not fetch weather from OpenWeather API',
      })
    }

    const currentData = currentRes
    const forecastData = forecastRes?.list || []

    // Process daily forecast summaries (extract 1 forecast per day around 12:00 PM)
    const dailyForecast = forecastData
      .filter((item) => item.dt_txt && item.dt_txt.includes('12:00:00'))
      .slice(0, 5)
      .map((item) => {
        const dateObj = new Date(item.dt * 1000)
        return {
          day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          temp: Math.round(item.main.temp),
          condition: item.weather[0]?.main || 'Clear',
          icon: item.weather[0]?.icon,
        }
      })

    const weatherPayload = {
      name: currentData.name || 'Campsite Region',
      temp: Math.round(currentData.main?.temp || 0),
      feelsLike: Math.round(currentData.main?.feels_like || 0),
      condition: currentData.weather?.[0]?.description || 'Clear',
      humidity: currentData.main?.humidity || 0,
      windSpeed: Math.round((currentData.wind?.speed || 0) * 3.6), // m/s to km/h
      rainProbability: currentData.clouds?.all || 0,
      forecast: dailyForecast,
    }

    res.json({ success: true, weather: weatherPayload })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
