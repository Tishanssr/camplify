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

    let currentRes = null
    let forecastRes = null

    // Helper to fetch OpenWeather current + forecast pair
    const fetchWeatherPair = async (url, forecastUrl) => {
      try {
        const [cRes, fRes] = await Promise.all([
          fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(forecastUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ])
        return cRes ? { currentRes: cRes, forecastRes: fRes } : null
      } catch (err) {
        return null
      }
    }

    // Step 1: Use exact latitude & longitude coordinates if provided
    if (hasCoords) {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      const result = await fetchWeatherPair(url, forecastUrl)
      if (result) {
        currentRes = result.currentRes
        forecastRes = result.forecastRes
      }
    }

    // Step 2: Extract candidate city names if coordinates were not provided or failed
    if (!currentRes && queryLocation) {
      const candidates = []

      // Extract text inside parentheses, e.g. "mnb,jhbjas (Sigiriya, Central Province)" -> "Sigiriya", "Central Province"
      const parenMatch = queryLocation.match(/\(([^)]+)\)/)
      if (parenMatch && parenMatch[1]) {
        parenMatch[1].split(',').forEach((p) => candidates.push(p.trim()))
      }

      // Split main string by comma, stripped of parentheses
      const mainClean = queryLocation.replace(/\(.*?\)/g, '')
      mainClean.split(',').forEach((p) => candidates.push(p.trim()))

      const cleanCandidates = [...new Set(candidates.filter((c) => c && c.length > 1))]

      for (const cityCandidate of cleanCandidates) {
        // Try with LK country code
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityCandidate)},LK&appid=${apiKey}&units=metric`
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityCandidate)},LK&appid=${apiKey}&units=metric`
        const result = await fetchWeatherPair(url, forecastUrl)
        if (result) {
          currentRes = result.currentRes
          forecastRes = result.forecastRes
          break
        }

        // Try global city lookup without LK suffix
        const globalUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityCandidate)}&appid=${apiKey}&units=metric`
        const globalForecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityCandidate)}&appid=${apiKey}&units=metric`
        const globalResult = await fetchWeatherPair(globalUrl, globalForecastUrl)
        if (globalResult) {
          currentRes = globalResult.currentRes
          forecastRes = globalResult.forecastRes
          break
        }
      }
    }

    // Step 3: Ultimate Fallback to Sri Lanka Center Coordinates (Sigiriya / Dambulla area: 7.8731, 80.7718)
    if (!currentRes) {
      const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?lat=7.8731&lon=80.7718&appid=${apiKey}&units=metric`
      const fallbackForecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=7.8731&lon=80.7718&appid=${apiKey}&units=metric`
      const result = await fetchWeatherPair(fallbackUrl, fallbackForecastUrl)
      if (result) {
        currentRes = result.currentRes
        forecastRes = result.forecastRes
      }
    }

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

