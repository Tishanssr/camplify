export const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

export const getTripCategory = (trip) => {
  if (!trip) return 'planning'
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const startDate = trip.startDate ? new Date(trip.startDate) : null
  const endDate = trip.endDate ? new Date(trip.endDate) : null

  // If status is completed/past or endDate is in the past
  if (
    trip.status?.toLowerCase() === 'completed' ||
    trip.status?.toLowerCase() === 'past' ||
    (endDate && endDate < now)
  ) {
    return 'past'
  }

  // If startDate is in future or currently active
  if (startDate) {
    startDate.setHours(0, 0, 0, 0)
    if (startDate >= now || (endDate && startDate <= now && endDate >= now)) {
      return 'upcoming'
    }
  } else if (trip.status?.toLowerCase() === 'upcoming') {
    return 'upcoming'
  }

  return 'planning'
}

export const getDaysLabel = (trip) => {
  if (!trip) return 'Planning'
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (trip.days !== undefined && !trip.startDate) return `${trip.days}d left`
  if (!trip.startDate) return 'Planning'

  const startDate = new Date(trip.startDate)
  startDate.setHours(0, 0, 0, 0)

  const diffTime = startDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0) return `${diffDays}d left`
  if (diffDays === 0) return 'Starts Today!'

  const endDate = trip.endDate ? new Date(trip.endDate) : null
  if (endDate && endDate >= now) return 'Ongoing'

  return 'Completed'
}
