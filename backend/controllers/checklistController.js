import groupChecklistModel from '../model/groupChecklistModel.js'
import tripModel from '../model/tripModel.js'
import userModel from '../model/userModel.js'
import notificationModel from '../model/notificationModel.js'

// Helper function to verify that user is trip organizer or confirmed/accepted participant
const checkTripAccess = async (tripId, userID) => {
  const trip = await tripModel.findById(tripId)
  if (!trip) return { allowed: false, message: 'Trip not found' }

  const isOrganizer = String(trip.organizer?._id || trip.organizer) === String(userID)
  if (isOrganizer) return { allowed: true, trip }

  const user = await userModel.findById(userID)
  const userEmail = (user?.email || '').toLowerCase()

  const participant = (trip.participants || []).find(
    (p) =>
      String(p.user?._id || p.user) === String(userID) ||
      (p.email && p.email.toLowerCase() === userEmail)
  )

  if (!participant) {
    return { allowed: false, message: 'Access denied. You are not a participant of this trip.' }
  }

  if (participant.status !== 'confirmed' && participant.status !== 'accepted') {
    return { allowed: false, message: 'Access denied. You must accept the trip invitation before accessing the checklist.' }
  }

  return { allowed: true, trip }
}

// Get Group Equipment Checklist for a Trip (flat list of items)
export const getGroupChecklist = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId } = req.params

    const access = await checkTripAccess(tripId, userID)
    if (!access.allowed) {
      return res.json({ success: false, message: access.message })
    }

    const docs = await groupChecklistModel.find({ trip: tripId })
    let items = []
    docs.forEach(doc => {
      if (Array.isArray(doc.items)) {
        items.push(...doc.items)
      }
    })

    res.json({ success: true, items })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Add a new item to group checklist
export const addGroupItem = async (req, res) => {
  try {
    const { tripId } = req.params
    const { name, quantity, assignedTo } = req.body

    if (!name || !name.trim()) {
      return res.json({ success: false, message: 'Equipment name is required' })
    }

    let checklistDoc = await groupChecklistModel.findOne({ trip: tripId })
    if (!checklistDoc) {
      checklistDoc = new groupChecklistModel({
        trip: tripId,
        items: [],
      })
    }

    let assignedName = ''
    if (assignedTo) {
      const assignedUser = await userModel.findById(assignedTo)
      if (assignedUser) {
        assignedName = assignedUser.name
      }
    }

    checklistDoc.items.push({
      name: name.trim(),
      quantity: quantity || '1',
      done: false,
      assignedTo: assignedTo || null,
      assignedName: assignedName || '',
    })

    await checklistDoc.save()

    const docs = await groupChecklistModel.find({ trip: tripId })
    let items = []
    docs.forEach(doc => {
      if (Array.isArray(doc.items)) {
        items.push(...doc.items)
      }
    })

    res.json({ success: true, message: 'Equipment item added successfully', items })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Toggle Item packed (done) status and notify organizer / participants
export const toggleGroupItem = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId, itemId } = req.params
    const { completed } = req.body

    const group = await groupChecklistModel.findOne({ trip: tripId, 'items._id': itemId })
    if (!group) {
      return res.json({ success: false, message: 'Checklist item not found' })
    }

    const item = group.items.id(itemId)
    if (!item) {
      return res.json({ success: false, message: 'Checklist item not found' })
    }

    item.done = completed !== undefined ? completed : !item.done
    await group.save()

    // Send Notification to Trip Organizer if item was packed by someone else
    try {
      const trip = await tripModel.findById(tripId)
      const currentUser = await userModel.findById(userID)

      if (trip && currentUser && item.done && String(trip.organizer) !== String(userID)) {
        await notificationModel.create({
          user: trip.organizer,
          title: 'Equipment Packed',
          text: `${currentUser.name} packed "${item.name}" for ${trip.name}.`,
          color: 'green',
          action: `/trips/${tripId}/checklist`,
          read: false,
        })
      }
    } catch (notifErr) {
      console.error('Failed to create notification for packed item:', notifErr.message)
    }

    const docs = await groupChecklistModel.find({ trip: tripId })
    let items = []
    docs.forEach(doc => {
      if (Array.isArray(doc.items)) {
        items.push(...doc.items)
      }
    })

    res.json({ success: true, message: 'Item status updated', items })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Assign item to a participant or claim equipment
export const assignGroupItem = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId, itemId } = req.params
    const { assignedTo } = req.body

    const group = await groupChecklistModel.findOne({ trip: tripId, 'items._id': itemId })
    if (!group) {
      return res.json({ success: false, message: 'Checklist item not found' })
    }

    const item = group.items.id(itemId)
    if (!item) {
      return res.json({ success: false, message: 'Checklist item not found' })
    }

    let assignedUser = null
    if (assignedTo) {
      assignedUser = await userModel.findById(assignedTo)
    }

    item.assignedTo = assignedUser ? assignedUser._id : null
    item.assignedName = assignedUser ? assignedUser.name : ''
    await group.save()

    // Send Notification to Assigned Participant
    try {
      const trip = await tripModel.findById(tripId)
      const assigningUser = await userModel.findById(userID)

      if (assignedUser && trip && String(assignedUser._id) !== String(userID)) {
        await notificationModel.create({
          user: assignedUser._id,
          title: 'New Equipment Assigned',
          text: `${assigningUser ? assigningUser.name : 'Trip Organizer'} assigned you to bring "${item.name}" for ${trip.name}.`,
          color: 'blue',
          action: `/trips/${tripId}/checklist`,
          read: false,
        })
      }
    } catch (notifErr) {
      console.error('Failed to create notification for assignment:', notifErr.message)
    }

    const docs = await groupChecklistModel.find({ trip: tripId })
    let items = []
    docs.forEach(doc => {
      if (Array.isArray(doc.items)) {
        items.push(...doc.items)
      }
    })

    res.json({ success: true, message: 'Equipment assignment updated', items })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Delete Item from group checklist
export const deleteGroupItem = async (req, res) => {
  try {
    const { tripId, itemId } = req.params

    const group = await groupChecklistModel.findOne({ trip: tripId, 'items._id': itemId })
    if (group) {
      group.items = group.items.filter((i) => String(i._id) !== itemId)
      await group.save()
    }

    const docs = await groupChecklistModel.find({ trip: tripId })
    let items = []
    docs.forEach(doc => {
      if (Array.isArray(doc.items)) {
        items.push(...doc.items)
      }
    })

    res.json({ success: true, message: 'Equipment item deleted', items })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
