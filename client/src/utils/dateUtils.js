export const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

export const getTripCategory = (trip) => {
  if (!trip) return 'upcoming'
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const startDate = trip.startDate ? new Date(trip.startDate) : null
  const endDate = trip.endDate ? new Date(trip.endDate) : null

  if (startDate) startDate.setHours(0, 0, 0, 0)
  if (endDate) endDate.setHours(23, 59, 59, 999)

  const status = trip.status?.toLowerCase()

  // 1. Past trips
  if (status === 'completed' || status === 'past' || (endDate && endDate < now)) {
    return 'past'
  }

  // 2. Ongoing trips
  if (status === 'ongoing' || (startDate && startDate <= now && (!endDate || endDate >= now))) {
    return 'ongoing'
  }

  // 3. Upcoming trips
  return 'upcoming'
}

export const getDaysLabel = (trip) => {
  if (!trip) return 'Upcoming'
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (trip.days !== undefined && !trip.startDate) return `${trip.days}d left`
  if (!trip.startDate) return 'Upcoming'

  const startDate = new Date(trip.startDate)
  startDate.setHours(0, 0, 0, 0)

  const endDate = trip.endDate ? new Date(trip.endDate) : null
  if (endDate) endDate.setHours(23, 59, 59, 999)

  if (startDate <= now && (!endDate || endDate >= now)) {
    if (endDate) {
      const endDiffTime = endDate - now
      const endDiffDays = Math.ceil(endDiffTime / (1000 * 60 * 60 * 24))
      if (endDiffDays > 0) return `${endDiffDays}d left`
    }
    return 'In Progress'
  }

  if (endDate && endDate < now) return 'Completed'

  const diffTime = startDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0) return `${diffDays}d left`
  if (diffDays === 0) return 'Starts Today!'

  return 'Completed'
}

export const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) {
    return 'Good morning'
  }
  if (hour < 17) {
    return 'Good afternoon'
  }
  return 'Good evening'
}

export const formatTime12h = (timeStr) => {
  if (!timeStr) return '7:30 AM'
  if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
    return timeStr
  }
  const parts = String(timeStr).trim().split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  if (isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}


