// Weather & forecast lookup controller
export const getWeather = async (req, res) => {
  try {
    const { lat, lon, q, location } = req.query
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OpenWeather API key is not configured on server',
      })
    }

    const hasCoords = lat !== undefined && lon !== undefined && lat !== '' && lon !== '' && !isNaN(Number(lat)) && !isNaN(Number(lon))
    let queryLocation = (q || location || '').trim()

    let url = ''
    let forecastUrl = ''

    if (hasCoords) {
      // Priority 1: Use exact latitude & longitude coordinates when provided
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    } else if (queryLocation) {
      // Priority 2: Use cleaned city name (first part before comma, e.g. "Kurunegala")
      const cleanCity = queryLocation.split(',')[0].trim()
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanCity)},LK&appid=${apiKey}&units=metric`
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cleanCity)},LK&appid=${apiKey}&units=metric`
    } else {
      // Priority 3: Fallback coordinates (Sri Lanka center)
      url = `https://api.openweathermap.org/data/2.5/weather?lat=7.8731&lon=80.7718&appid=${apiKey}&units=metric`
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=7.8731&lon=80.7718&appid=${apiKey}&units=metric`
    }


    const [currentRes, forecastRes] = await Promise.all([
      fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(forecastUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])

    if (!currentRes) {
      return res.status(502).json({
        success: false,
        message: 'Could not fetch current weather from OpenWeather API',
      })
    }

    const currentData = currentRes
    const forecastData = forecastRes?.list || []

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
          description: item.weather[0]?.description || 'Clear sky',
          icon: item.weather[0]?.icon,
          rainProbability: Math.round((item.pop || 0) * 100),
        }
      })

    // Compute current rain probability using the nearest forecast item's pop value if available
    const firstForecastPop = forecastData[0]?.pop !== undefined ? Math.round(forecastData[0].pop * 100) : 0

    const weatherPayload = {
      name: currentData.name || queryLocation || 'Campsite Region',
      temp: Math.round(currentData.main?.temp || 0),
      feelsLike: Math.round(currentData.main?.feels_like || 0),
      condition: currentData.weather?.[0]?.main || 'Clear',
      description: currentData.weather?.[0]?.description || 'Clear sky',
      humidity: currentData.main?.humidity || 0,
      windSpeed: Math.round((currentData.wind?.speed || 0) * 3.6), // m/s to km/h
      rainProbability: firstForecastPop,
      clouds: currentData.clouds?.all || 0,
      forecast: dailyForecast,
    }

    res.json({ success: true, weather: weatherPayload })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

