import mongoose from 'mongoose'
import tripModel from '../model/tripModel.js'
import userModel from '../model/userModel.js'
import invitationModel from '../model/invitationModel.js'
import notificationModel from '../model/notificationModel.js'
import groupChecklistModel from '../model/groupChecklistModel.js'

// Get all trips for the authenticated user
export const getTrips = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)
    const userEmail = (user?.email || '').toLowerCase()

    const trips = await tripModel
      .find({
        $or: [
          { organizer: userID },
          {
            participants: {
              $elemMatch: {
                $or: [{ user: userID }, { email: userEmail }],
                status: { $nin: ['rejected', 'declined'] },
              },
            },
          },
        ],
      })
      .populate('organizer', 'name email')
      .populate('participants.user', 'name email')
      .sort({ createdAt: -1 })

    const cleanedTrips = trips.map((trip) => {
      const tripObj = trip.toObject ? trip.toObject() : trip
      if (Array.isArray(tripObj.participants)) {
        tripObj.participants = tripObj.participants.filter(
          (p) => p.status !== 'rejected' && p.status !== 'declined'
        )
      }
      return tripObj
    })

    res.json({ success: true, trips: cleanedTrips })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get single trip by ID with populated organizer and participants.user
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params
    let trip = null

    if (mongoose.Types.ObjectId.isValid(id)) {
      trip = await tripModel
        .findById(id)
        .populate('organizer', 'name email')
        .populate('participants.user', 'name email')
    } else {
      trip = await tripModel
        .findOne({ name: new RegExp(id, 'i') })
        .populate('organizer', 'name email')
        .populate('participants.user', 'name email')
    }

    if (!trip) {
      return res.json({ success: false, message: 'Trip not found' })
    }

    // Ensure trip.participants always includes the organizer
    if (!trip.participants || trip.participants.length === 0) {
      trip.participants = [
        {
          user: trip.organizer,
          email: trip.organizer?.email || '',
          role: 'organizer',
          status: 'confirmed',
        },
      ]
    } else {
      const hasOrganizer = trip.participants.some(
        (p) =>
          p.role === 'organizer' ||
          String(p.user?._id || p.user) === String(trip.organizer?._id || trip.organizer)
      )

      if (!hasOrganizer && trip.organizer) {
        trip.participants.unshift({
          user: trip.organizer,
          email: trip.organizer?.email || '',
          role: 'organizer',
          status: 'confirmed',
        })
      }
    }

    // Filter out declined/rejected participants from response
    if (Array.isArray(trip.participants)) {
      trip.participants = trip.participants.filter(
        (p) => p.status !== 'rejected' && p.status !== 'declined'
      )
    }

    res.json({ success: true, trip })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Create a new trip
export const createTrip = async (req, res) => {
  try {
    const userID = req.userID
    const { name, description, location, startDate, endDate, meetingPoint, gear, invitedParticipants } = req.body

    if (!name || !location) {
      return res.json({ success: false, message: 'Trip name and location are required' })
    }

    const organizerUser = await userModel.findById(userID)

    const initialParticipants = [
      {
        user: userID,
        email: organizerUser ? organizerUser.email.toLowerCase() : '',
        role: 'organizer',
        status: 'confirmed',
      },
    ]

    // Process invited participants provided during trip creation wizard
    if (Array.isArray(invitedParticipants) && invitedParticipants.length > 0) {
      for (const email of invitedParticipants) {
        const cleanEmail = String(email).toLowerCase().trim()
        if (!cleanEmail || cleanEmail === organizerUser?.email?.toLowerCase()) continue

        const targetUser = await userModel.findOne({ email: cleanEmail })
        if (targetUser) {
          initialParticipants.push({
            user: targetUser._id,
            email: cleanEmail,
            role: 'participant',
            status: 'pending',
          })
        } else {
          initialParticipants.push({
            email: cleanEmail,
            role: 'participant',
            status: 'pending',
          })
        }
      }
    }

    const newTrip = new tripModel({
      organizer: userID,
      name,
      description: description || '',
      location,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      meetingPoint: meetingPoint || '',
      status: 'planning',
      gear: Array.isArray(gear) ? gear : [],
      participants: initialParticipants,
    })

    await newTrip.save()

    // Send invitations and notifications to registered target users
    for (const p of initialParticipants) {
      if (p.role === 'participant' && p.user) {
        const inviteCode = `${newTrip._id.toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`
        const invitation = new invitationModel({
          trip: newTrip._id,
          invitedBy: userID,
          email: p.email,
          inviteCode,
          status: 'pending',
        })
        await invitation.save()

        const notification = new notificationModel({
          user: p.user,
          title: `Trip Invitation: ${newTrip.name}`,
          text: `You have been invited by the organizer to join ${newTrip.name} in ${newTrip.location}.`,
          color: 'yellow',
          action: 'Invitation pending',
        })
        await notification.save()
      }
    }

    const populatedTrip = await tripModel
      .findById(newTrip._id)
      .populate('organizer', 'name email')
      .populate('participants.user', 'name email')

    res.json({ success: true, message: 'Trip created successfully', trip: populatedTrip })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Update trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params
    const updatedTrip = await tripModel.findByIdAndUpdate(id, req.body, { new: true })
    res.json({ success: true, message: 'Trip updated', trip: updatedTrip })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Delete trip (ONLY organizer can delete, cascading deletes group checklists, invitations, & notifies participants)
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params
    const userID = req.userID

    const trip = await tripModel.findById(id)
    if (!trip) {
      return res.json({ success: false, message: 'Trip not found' })
    }

    // Verify permission: only organizer can delete
    const organizerId = String(trip.organizer?._id || trip.organizer)
    if (organizerId !== String(userID)) {
      return res.json({ success: false, message: 'Only the trip organizer can delete this trip' })
    }

    // Cascading cleanups: delete group checklists & invitations linked to this trip
    await groupChecklistModel.deleteMany({ trip: id })
    await invitationModel.deleteMany({ trip: id })

    // Notify participants about trip deletion
    if (Array.isArray(trip.participants)) {
      for (const p of trip.participants) {
        const participantUserId = p.user?._id || p.user
        if (participantUserId && String(participantUserId) !== String(userID)) {
          const notification = new notificationModel({
            user: participantUserId,
            title: `Trip Deleted: ${trip.name}`,
            text: `The trip organizer has deleted "${trip.name}".`,
            color: 'red',
            action: 'Trip deleted',
          })
          await notification.save().catch(e => console.error('Error saving notification:', e))
        }
      }
    }

    await tripModel.findByIdAndDelete(id)
    res.json({ success: true, message: 'Trip and associated participants successfully deleted' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Invite participant by email (ONLY the trip creator / organizer can invite registered users)
export const inviteParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.body
    const userID = req.userID

    if (!email) {
      return res.json({ success: false, message: 'Email address is required' })
    }

    // 1. Verify trip exists
    const trip = await tripModel.findById(id)
    if (!trip) {
      return res.json({ success: false, message: 'Trip not found' })
    }

    // 2. Strict Check: Only the trip creator (organizer) can invite participants
    if (String(trip.organizer) !== String(userID)) {
      return res.json({
        success: false,
        message: 'Only the trip creator (organizer) can invite participants to this trip.',
      })
    }

    const cleanEmail = email.toLowerCase().trim()

    // 3. Verify user exists in the system database
    const targetUser = await userModel.findOne({ email: cleanEmail })
    if (!targetUser) {
      return res.json({
        success: false,
        message: 'No registered user found with this email address. Please ask them to register first.',
      })
    }

    // 4. Check if user is already invited/added
    const alreadyInvited = trip.participants.some(
      (p) => String(p.user) === String(targetUser._id) || p.email === cleanEmail
    )
    if (alreadyInvited) {
      return res.json({
        success: false,
        message: `${targetUser.name} (${cleanEmail}) is already a participant or invited to this trip.`,
      })
    }

    // 5. Add user to trip participants with status 'pending'
    trip.participants.push({
      user: targetUser._id,
      email: cleanEmail,
      role: 'participant',
      status: 'pending',
    })
    await trip.save()

    // 6. Create Invitation record
    const inviteCode = `${id.slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`
    const invitation = new invitationModel({
      trip: id,
      invitedBy: userID,
      email: cleanEmail,
      inviteCode,
      status: 'pending',
    })
    await invitation.save()

    // 7. Push notification to the invited user
    const notification = new notificationModel({
      user: targetUser._id,
      title: `Trip Invitation: ${trip.name}`,
      text: `You have been invited by the organizer to join ${trip.name} in ${trip.location}.`,
      color: 'yellow',
      action: 'Invitation pending',
    })
    await notification.save()

    // Return populated trip data
    const updatedTrip = await tripModel
      .findById(id)
      .populate('organizer', 'name email')
      .populate('participants.user', 'name email')

    res.json({
      success: true,
      message: `Invitation sent to registered user ${targetUser.name} (${targetUser.email})!`,
      inviteCode,
      user: { name: targetUser.name, email: targetUser.email },
      trip: updatedTrip,
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
