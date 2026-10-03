import React from 'react'
import {
  FaSun,
  FaCloudSun,
  FaCloud,
  FaCloudRain,
  FaCloudShowersHeavy,
  FaBolt,
  FaSnowflake,
  FaSmog,
} from 'react-icons/fa'

export default function WeatherIcon({ condition = '', className = 'text-amber-400' }) {
  const condLower = (condition || '').toLowerCase().trim()

  if (condLower.includes('clear') || condLower.includes('sun')) {
    return <FaSun className={className} />
  }
  if (condLower.includes('thunder') || condLower.includes('lightning') || condLower.includes('storm')) {
    return <FaBolt className={className || 'text-yellow-400'} />
  }
  if (condLower.includes('heavy rain') || condLower.includes('shower')) {
    return <FaCloudShowersHeavy className={className || 'text-blue-400'} />
  }
  if (condLower.includes('rain') || condLower.includes('drizzle')) {
    return <FaCloudRain className={className || 'text-blue-300'} />
  }
  if (condLower.includes('snow') || condLower.includes('ice') || condLower.includes('sleet')) {
    return <FaSnowflake className={className || 'text-sky-200'} />
  }
  if (condLower.includes('mist') || condLower.includes('fog') || condLower.includes('haze') || condLower.includes('smoke')) {
    return <FaSmog className={className || 'text-gray-300'} />
  }
  if (condLower.includes('cloud')) {
    return <FaCloudSun className={className || 'text-amber-200'} />
  }

  return <FaCloudSun className={className} />
}
