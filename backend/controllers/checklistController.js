import groupChecklistModel from '../model/groupChecklistModel.js'
import tripModel from '../model/tripModel.js'
import userModel from '../model/userModel.js'
import notificationModel from '../model/notificationModel.js'
import { isPremiumActive } from '../utils/premiumUtils.js'
import { requireTripMember, requireTripOrganizer, validateParticipantOfTrip } from '../middleware/tripAuth.js'
import { sseRegistry } from '../utils/sseRegistry.js'

// Gather active member IDs (organizer + confirmed participants) for updates & notifications
const getTripMemberUserIds = (trip) => {
  const memberIds = [trip.organizer.toString()]
  if (Array.isArray(trip.participants)) {
    trip.participants.forEach((p) => {
      if (p.user && p.status === 'confirmed') {
        const pId = p.user.toString()
        if (!memberIds.includes(pId)) {
          memberIds.push(pId)
        }
      }
    })
  }
  return memberIds
}

// Fetch group checklist items
export const getGroupChecklist = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId } = req.params

    const roleCheck = await requireTripMember(tripId, userID)
    if (roleCheck.errorStatus) {
      return res.status(roleCheck.errorStatus).json({ success: false, message: roleCheck.errorMessage })
    }

    const doc = await groupChecklistModel.findOne({ trip: tripId })
    const items = doc && Array.isArray(doc.items) ? doc.items : []

    res.json({ success: true, items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Add item to group checklist (Organizer only)
export const addGroupItem = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId } = req.params
    const { name, quantity, description, assignedTo } = req.body

    const roleCheck = await requireTripOrganizer(tripId, userID)
    if (roleCheck.errorStatus) {
      return res.status(roleCheck.errorStatus).json({ success: false, message: roleCheck.errorMessage })
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Equipment name is required' })
    }

    const { trip } = roleCheck

    // Premium limits enforcement
    const isPremium = isPremiumActive(trip.organizer)
    let checklistDoc = await groupChecklistModel.findOne({ trip: tripId })
    const currentItemCount = checklistDoc && Array.isArray(checklistDoc.items) ? checklistDoc.items.length : 0

    if (!isPremium && currentItemCount >= 6) {
      return res.status(403).json({
        success: false,
        limitReached: true,
        message: 'Free plan limit reached: Trips on the Free plan can have a maximum of 6 shared checklist items. Upgrade to Premium for unlimited checklist items.',
        upgradeUrl: '/pricing',
      })
    }

    let assignedName = ''
    if (assignedTo) {
      const isValid = validateParticipantOfTrip(trip, assignedTo)
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Assigned user is not a confirmed member of this trip' })
      }
      const assignedUser = await userModel.findById(assignedTo)
      if (assignedUser) {
        assignedName = assignedUser.name
      }
    }

    const newItem = {
      name: name.trim(),
      quantity: quantity !== undefined ? String(quantity) : '1',
      description: description ? description.trim() : '',
      done: false,
      assignedTo: assignedTo || null,
      assignedName: assignedName || '',
    }

    const updatedDoc = await groupChecklistModel.findOneAndUpdate(
      { trip: tripId },
      { $push: { items: newItem } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    )

    const createdItem = updatedDoc.items[updatedDoc.items.length - 1]

    // Send notifications and SSE updates to trip members (except performer)
    const memberIds = getTripMemberUserIds(trip)
    const organizerUser = await userModel.findById(userID)
    const organizerName = organizerUser ? organizerUser.name : 'Trip Organizer'

    for (const memberId of memberIds) {
      if (memberId !== userID) {
        // Send SSE event
        sseRegistry.sendToUser(memberId, 'checklist_update', {
          tripId,
          action: 'item_added',
          itemId: createdItem._id,
          performerId: userID,
        })

        // Create DB notification for confirmed participants
        try {
          await notificationModel.create({
            user: memberId,
            title: 'New Equipment Added',
            text: `${organizerName} added "${createdItem.name}" to the equipment checklist for ${trip.name}.`,
            color: 'blue',
            action: `/trips/${tripId}/checklist`,
            read: false,
          })
        } catch (notifErr) {
          console.error('Failed to create notification for added item:', notifErr.message)
        }
      }
    }

    res.json({ success: true, message: 'Equipment item added successfully', items: updatedDoc.items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Edit item in group checklist (Organizer only)
export const editGroupItem = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId, itemId } = req.params

    const roleCheck = await requireTripOrganizer(tripId, userID)
    if (roleCheck.errorStatus) {
      return res.status(roleCheck.errorStatus).json({ success: false, message: roleCheck.errorMessage })
    }

    // Check for restricted fields in req.body
    const restrictedFields = ['done', 'assignedTo', 'assignedName', 'tripId']
    const bodyKeys = Object.keys(req.body)
    const containsRestricted = restrictedFields.some((field) => bodyKeys.includes(field))

    if (containsRestricted) {
      return res.status(400).json({
        success: false,
        message: 'Modifying restricted fields (done, assignedTo, assignedName, tripId) is not allowed through the edit endpoint.',
      })
    }

    const { name, quantity, description } = req.body

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ success: false, message: 'Equipment name cannot be empty' })
    }

    const group = await groupChecklistModel.findOne({ trip: tripId, 'items._id': itemId })
    if (!group) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    const item = group.items.id(itemId)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    if (name !== undefined) item.name = name.trim()
    if (quantity !== undefined) item.quantity = String(quantity)
    if (description !== undefined) item.description = description.trim()

    await group.save()

    // Send notifications and SSE updates to trip members (except performer)
    const { trip } = roleCheck
    const memberIds = getTripMemberUserIds(trip)
    const organizerUser = await userModel.findById(userID)
    const organizerName = organizerUser ? organizerUser.name : 'Trip Organizer'

    for (const memberId of memberIds) {
      if (memberId !== userID) {
        sseRegistry.sendToUser(memberId, 'checklist_update', {
          tripId,
          action: 'item_edited',
          itemId: item._id,
          performerId: userID,
        })

        try {
          await notificationModel.create({
            user: memberId,
            title: 'Equipment Details Updated',
            text: `${organizerName} updated the details for "${item.name}" in ${trip.name}.`,
            color: 'blue',
            action: `/trips/${tripId}/checklist`,
            read: false,
          })
        } catch (notifErr) {
          console.error('Failed to create notification for edited item:', notifErr.message)
        }
      }
    }

    res.json({ success: true, message: 'Equipment item updated successfully', items: group.items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Toggle item completion (Organizer or Assigned Participant)
export const toggleGroupItem = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId, itemId } = req.params
    const { completed } = req.body

    const roleCheck = await requireTripMember(tripId, userID)
    if (roleCheck.errorStatus) {
      return res.status(roleCheck.errorStatus).json({ success: false, message: roleCheck.errorMessage })
    }

    const group = await groupChecklistModel.findOne({ trip: tripId, 'items._id': itemId })
    if (!group) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    const item = group.items.id(itemId)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    // Role check: non-organizers can only toggle items assigned to themselves
    if (!roleCheck.isOrganizer) {
      if (!item.assignedTo || item.assignedTo.toString() !== userID.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only toggle completion for equipment assigned to yourself',
        })
      }
    }

    item.done = completed !== undefined ? completed : !item.done
    await group.save()

    const { trip } = roleCheck
    const currentUser = await userModel.findById(userID)
    const currentUserName = currentUser ? currentUser.name : 'A member'

    // Notifications logic
    if (!roleCheck.isOrganizer && item.done) {
      // Participant completed item -> Notify organizer
      try {
        await notificationModel.create({
          user: trip.organizer,
          title: 'Equipment Packed',
          text: `${currentUserName} packed "${item.name}" for ${trip.name}.`,
          color: 'green',
          action: `/trips/${tripId}/checklist`,
          read: false,
        })
      } catch (notifErr) {
        console.error('Failed to create notification for packed item:', notifErr.message)
      }
    } else if (roleCheck.isOrganizer && item.assignedTo && item.assignedTo.toString() !== userID.toString()) {
      // Organizer toggled item assigned to someone else -> Notify assigned user
      try {
        await notificationModel.create({
          user: item.assignedTo,
          title: item.done ? 'Equipment Packed' : 'Equipment Status Changed',
          text: `Organizer updated "${item.name}" to ${item.done ? 'packed' : 'unpacked'} for ${trip.name}.`,
          color: item.done ? 'green' : 'blue',
          action: `/trips/${tripId}/checklist`,
          read: false,
        })
      } catch (notifErr) {
        console.error('Failed to create notification for organizer toggle:', notifErr.message)
      }
    }

    // SSE notification to members except performer
    const memberIds = getTripMemberUserIds(trip)
    for (const memberId of memberIds) {
      if (memberId !== userID) {
        sseRegistry.sendToUser(memberId, 'checklist_update', {
          tripId,
          action: 'item_toggled',
          itemId: item._id,
          done: item.done,
          performerId: userID,
        })
      }
    }

    res.json({ success: true, message: 'Item status updated', items: group.items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Assign item to user (Organizer full control, Participant self-claim unassigned)
export const assignGroupItem = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId, itemId } = req.params
    const { assignedTo } = req.body

    const roleCheck = await requireTripMember(tripId, userID)
    if (roleCheck.errorStatus) {
      return res.status(roleCheck.errorStatus).json({ success: false, message: roleCheck.errorMessage })
    }

    const group = await groupChecklistModel.findOne({ trip: tripId, 'items._id': itemId })
    if (!group) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    const item = group.items.id(itemId)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    const { trip, isOrganizer } = roleCheck
    const prevAssignedTo = item.assignedTo ? item.assignedTo.toString() : null

    if (!isOrganizer) {
      // Participant Claim Gear checks
      if (!assignedTo || assignedTo.toString() !== userID.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Participants may only claim equipment for themselves',
        })
      }
      if (prevAssignedTo) {
        return res.status(403).json({
          success: false,
          message: 'Equipment item is already assigned to another participant',
        })
      }
    } else {
      // Organizer assigning check
      if (assignedTo) {
        const isValid = validateParticipantOfTrip(trip, assignedTo)
        if (!isValid) {
          return res.status(400).json({ success: false, message: 'Assigned user is not a confirmed member of this trip' })
        }
      }
    }

    let assignedUser = null
    if (assignedTo) {
      assignedUser = await userModel.findById(assignedTo)
    }

    item.assignedTo = assignedUser ? assignedUser._id : null
    item.assignedName = assignedUser ? assignedUser.name : ''
    await group.save()

    const assigningUser = await userModel.findById(userID)
    const assigningUserName = assigningUser ? assigningUser.name : 'A trip member'

    // Notifications logic
    if (!isOrganizer && assignedUser) {
      // Participant self-claimed -> Notify organizer
      if (trip.organizer.toString() !== userID.toString()) {
        try {
          await notificationModel.create({
            user: trip.organizer,
            title: 'Equipment Claimed',
            text: `${assigningUserName} claimed "${item.name}" for ${trip.name}.`,
            color: 'blue',
            action: `/trips/${tripId}/checklist`,
            read: false,
          })
        } catch (notifErr) {
          console.error('Failed to notify organizer of claimed item:', notifErr.message)
        }
      }
    } else if (isOrganizer) {
      // Organizer assigned / reassigned / unassigned
      if (assignedUser && assignedUser._id.toString() !== userID.toString()) {
        try {
          await notificationModel.create({
            user: assignedUser._id,
            title: 'New Equipment Assigned',
            text: `${assigningUserName} assigned you to bring "${item.name}" for ${trip.name}.`,
            color: 'blue',
            action: `/trips/${tripId}/checklist`,
            read: false,
          })
        } catch (notifErr) {
          console.error('Failed to notify assigned user:', notifErr.message)
        }
      }

      if (prevAssignedTo && prevAssignedTo !== userID.toString() && prevAssignedTo !== (assignedUser ? assignedUser._id.toString() : null)) {
        try {
          await notificationModel.create({
            user: prevAssignedTo,
            title: 'Equipment Unassigned',
            text: `You are no longer assigned to bring "${item.name}" for ${trip.name}.`,
            color: 'blue',
            action: `/trips/${tripId}/checklist`,
            read: false,
          })
        } catch (notifErr) {
          console.error('Failed to notify previous assignee:', notifErr.message)
        }
      }
    }

    // SSE updates to members except performer
    const memberIds = getTripMemberUserIds(trip)
    for (const memberId of memberIds) {
      if (memberId !== userID) {
        sseRegistry.sendToUser(memberId, 'checklist_update', {
          tripId,
          action: 'item_assigned',
          itemId: item._id,
          assignedTo: item.assignedTo,
          performerId: userID,
        })
      }
    }

    res.json({ success: true, message: 'Equipment assignment updated', items: group.items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Remove checklist item (Organizer only)
export const deleteGroupItem = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId, itemId } = req.params

    const roleCheck = await requireTripOrganizer(tripId, userID)
    if (roleCheck.errorStatus) {
      return res.status(roleCheck.errorStatus).json({ success: false, message: roleCheck.errorMessage })
    }

    const group = await groupChecklistModel.findOne({ trip: tripId, 'items._id': itemId })
    if (!group) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    const itemToDelete = group.items.id(itemId)
    if (!itemToDelete) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    const itemName = itemToDelete.name
    const prevAssignedTo = itemToDelete.assignedTo ? itemToDelete.assignedTo.toString() : null

    group.items = group.items.filter((i) => i._id.toString() !== itemId)
    await group.save()

    const { trip } = roleCheck
    const organizerUser = await userModel.findById(userID)
    const organizerName = organizerUser ? organizerUser.name : 'Trip Organizer'

    // Notifications logic
    const memberIds = getTripMemberUserIds(trip)
    for (const memberId of memberIds) {
      if (memberId !== userID) {
        sseRegistry.sendToUser(memberId, 'checklist_update', {
          tripId,
          action: 'item_deleted',
          itemId,
          performerId: userID,
        })

        try {
          const isFormerAssignee = prevAssignedTo && prevAssignedTo === memberId
          const text = isFormerAssignee
            ? `${organizerName} deleted equipment item "${itemName}" which was assigned to you for ${trip.name}.`
            : `${organizerName} removed "${itemName}" from the equipment checklist for ${trip.name}.`

          await notificationModel.create({
            user: memberId,
            title: 'Equipment Removed',
            text,
            color: 'blue',
            action: `/trips/${tripId}/checklist`,
            read: false,
          })
        } catch (notifErr) {
          console.error('Failed to create notification for deleted item:', notifErr.message)
        }
      }
    }

    res.json({ success: true, message: 'Equipment item deleted', items: group.items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
