import mongoose from 'mongoose'
import crypto from 'crypto'
import tripModel from '../model/tripModel.js'
import userModel from '../model/userModel.js'
import invitationModel from '../model/invitationModel.js'
import notificationModel from '../model/notificationModel.js'
import groupChecklistModel from '../model/groupChecklistModel.js'
import campsiteModel from '../model/campsiteModel.js'
import transporter from '../config/emailService.js'
import { isPremiumActive } from '../utils/premiumUtils.js'
import { streamObjectFromOracleStorage } from '../config/ociStorageService.js'
import { sseRegistry } from '../utils/sseRegistry.js'


// Fetch user trips
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
                status: { $in: ['confirmed', 'accepted'] },
              },
            },
          },
        ],
      })
      .populate('organizer', 'name email')
      .populate('participants.user', 'name email')
      .populate('campsiteId', 'name location coordinates images image offlineMapKey')
      .sort({ createdAt: -1 })

    const cleanedTrips = trips.map((trip) => {
      const tripObj = trip.toObject ? trip.toObject() : trip
      if (Array.isArray(tripObj.participants)) {
        tripObj.participants = tripObj.participants.filter(
          (p) =>
            p.status === 'confirmed' ||
            p.status === 'accepted' ||
            String(p.user?._id || p.user) === String(trip.organizer?._id || trip.organizer)
        )
      }
      tripObj.image = tripObj.image || tripObj.campsiteId?.images?.[0] || tripObj.campsiteId?.image || null
      return tripObj
    })

    res.json({ success: true, trips: cleanedTrips })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get trip details by ID
export const getTripById = async (req, res) => {
  try {
    const userID = req.userID
    const { id } = req.params
    let trip = null

    if (mongoose.Types.ObjectId.isValid(id)) {
      trip = await tripModel
        .findById(id)
        .populate('organizer', 'name email isPremium premiumExpiresAt')
        .populate('participants.user', 'name email')
        .populate('campsiteId', 'name location images image offlineMapKey')
    } else {
      trip = await tripModel
        .findOne({ name: new RegExp(id, 'i') })
        .populate('organizer', 'name email isPremium premiumExpiresAt')
        .populate('participants.user', 'name email')
        .populate('campsiteId', 'name location images image offlineMapKey')
    }

    if (!trip) {
      return res.json({ success: false, message: 'Trip not found' })
    }

    const currentUser = await userModel.findById(userID)
    const userEmail = (currentUser?.email || '').toLowerCase()

    const isOrganizer = String(trip.organizer?._id || trip.organizer) === String(userID)

    const participantEntry = (trip.participants || []).find(
      (p) =>
        String(p.user?._id || p.user) === String(userID) ||
        (p.email && p.email.toLowerCase() === userEmail)
    )

    if (!isOrganizer) {
      if (!participantEntry) {
        return res.json({
          success: false,
          accessDenied: true,
          message: 'Access denied. You are not a participant of this trip.',
        })
      }

      if (participantEntry.status === 'pending') {
        const invitation = await invitationModel.findOne({
          trip: trip._id,
          email: userEmail,
          status: 'pending',
        })

        return res.json({
          success: false,
          accessDenied: true,
          isPendingInvite: true,
          invitationId: invitation ? invitation._id : null,
          tripId: trip._id,
          tripName: trip.name,
          location: trip.location,
          organizerName: trip.organizer?.name || 'Trip Organizer',
          message: 'You have a pending invitation to this trip. Please accept the invitation first to access trip details.',
        })
      }

      if (participantEntry.status === 'rejected' || participantEntry.status === 'declined') {
        return res.json({
          success: false,
          accessDenied: true,
          message: 'Access denied. You declined the invitation to this trip.',
        })
      }
    }

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

    if (Array.isArray(trip.participants)) {
      trip.participants = trip.participants.filter(
        (p) =>
          p.status === 'confirmed' ||
          p.status === 'accepted' ||
          String(p.user?._id || p.user) === String(trip.organizer?._id || trip.organizer)
      )
    }

    const campsite = trip.campsiteId
    const campsiteHasOfflineMap = Boolean(campsite && campsite.offlineMapKey)
    const organizerIsPremium = isPremiumActive(trip.organizer)

    const tripObj = trip.toObject ? trip.toObject() : JSON.parse(JSON.stringify(trip))
    if (tripObj.campsiteId && tripObj.campsiteId.offlineMapKey !== undefined) {
      delete tripObj.campsiteId.offlineMapKey
    }
    tripObj.image = tripObj.image || tripObj.campsiteId?.images?.[0] || tripObj.campsiteId?.image || null
    tripObj.organizerIsPremium = organizerIsPremium
    tripObj.campsiteHasOfflineMap = campsiteHasOfflineMap

    res.json({ success: true, trip: tripObj })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Create new trip
export const createTrip = async (req, res) => {
  try {
    const userID = req.userID
    const { name, description, location, image, coordinates, startDate, endDate, meetingPoint, meetingTime, meetingCoordinates, gear, invitedParticipants, campsiteId } = req.body

    if (!name || !location) {
      return res.json({ success: false, message: 'Trip name and location are required' })
    }

    const organizerUser = await userModel.findById(userID)
    const isPremium = isPremiumActive(organizerUser)
    const totalParticipants = 1 + (Array.isArray(invitedParticipants) ? invitedParticipants.length : 0)

    if (!isPremium && totalParticipants > 10) {
      return res.json({
        success: false,
        limitReached: true,
        message: 'Free plan limit: Trips cannot exceed 10 total participants (including organizer). Upgrade to Premium for unlimited participants.',
        upgradeUrl: '/pricing',
      })
    }

    const initialParticipants = [
      {
        user: userID,
        email: organizerUser ? organizerUser.email.toLowerCase() : '',
        role: 'organizer',
        status: 'confirmed',
      },
    ]

    if (Array.isArray(invitedParticipants) && invitedParticipants.length > 0) {
      for (const email of invitedParticipants) {
        const cleanEmail = String(email).toLowerCase().trim()
        if (!cleanEmail) continue
        if (cleanEmail === organizerUser?.email?.toLowerCase()) {
          return res.json({
            success: false,
            message: 'You are automatically included as the trip organizer. No need to invite yourself.',
          })
        }

        const targetUser = await userModel.findOne({ email: cleanEmail })

        initialParticipants.push({
          user: targetUser ? targetUser._id : null,
          email: cleanEmail,
          role: 'participant',
          status: 'pending',
        })
      }
    }

    let finalCampsiteId = campsiteId && mongoose.Types.ObjectId.isValid(campsiteId) ? campsiteId : null
    let tripImage = image || null
    let finalCoordinates = coordinates && typeof coordinates === 'object' && coordinates.lat && coordinates.lng ? coordinates : undefined

    let site = null
    if (finalCampsiteId) {
      site = await campsiteModel.findById(finalCampsiteId)
    } else if (location && typeof location === 'string') {
      const cleanLoc = location.split('(')[0].trim()
      site = await campsiteModel.findOne({ name: { $regex: new RegExp(cleanLoc, 'i') } })
    }

    if (site) {
      finalCampsiteId = site._id
      if (!finalCoordinates && site.coordinates?.lat && site.coordinates?.lng) {
        finalCoordinates = { lat: Number(site.coordinates.lat), lng: Number(site.coordinates.lng) }
      }
      if (!tripImage) {
        tripImage = site.images?.[0] || site.image || null
      }
    }

    const newTrip = new tripModel({
      organizer: userID,
      campsiteId: finalCampsiteId,
      name,
      description: description || '',
      location,
      image: tripImage,
      coordinates: finalCoordinates,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      meetingPoint: meetingPoint || '',
      meetingTime: meetingTime || '07:30',
      meetingCoordinates: meetingCoordinates && typeof meetingCoordinates === 'object' && meetingCoordinates.lat && meetingCoordinates.lng ? meetingCoordinates : undefined,
      status: 'planning',
      gear: Array.isArray(gear) ? gear : [],
      participants: initialParticipants,
    })




    await newTrip.save()

    for (const p of initialParticipants) {
      if (p.role === 'participant') {
        const inviteCode = `${newTrip._id.toString().slice(-6)}-${crypto.randomInt(1000, 10000)}`
        const invitation = new invitationModel({
          trip: newTrip._id,
          invitedBy: userID,
          email: p.email,
          inviteCode,
          status: 'pending',
        })
        await invitation.save()

        if (p.user) {
          const notification = new notificationModel({
            user: p.user,
            title: `Trip Invitation: ${newTrip.name}`,
            text: `You have been invited by the organizer to join ${newTrip.name} in ${newTrip.location}.`,
            color: 'yellow',
            action: 'Invitation pending',
            type: 'invitation',
            relatedId: newTrip._id,
          })
          await notification.save()
        }

        // Send Email Invitation with Direct Link
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
        const inviteLink = `${clientUrl}/invite/${inviteCode}`
        const mailOptions = {
          from: process.env.SENDER_EMAIL || 'no-reply@camplify.com',
          to: p.email,
          subject: `You're Invited to Join ${newTrip.name} on Camplify!`,
          text: `You have been invited by ${organizerUser?.name || 'a friend'} to join ${newTrip.name} in ${newTrip.location}.\n\nClick the link below to view and accept your invitation:\n${inviteLink}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; color: #333; border: 1px solid #e0e0e0; border-radius: 12px;">
              <h2 style="color: #277530; margin-top: 0;">Camping Trip Invitation</h2>
              <p>Hello!</p>
              <p><b>${organizerUser?.name || 'A fellow camper'}</b> invited you to join their camping trip:</p>
              <div style="background-color: #f4f9f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px 0; color: #277530;">${newTrip.name}</h3>
                <p style="margin: 4px 0; font-size: 14px; color: #555;"><b>Location:</b> ${newTrip.location}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #555;"><b>Dates:</b> ${new Date(newTrip.startDate).toLocaleDateString()} - ${new Date(newTrip.endDate).toLocaleDateString()}</p>
              </div>
              <p>Click the button below to view the trip details and accept your invitation:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${inviteLink}" style="background-color: #277530; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  View & Accept Invitation
                </a>
              </div>
              <p style="font-size: 12px; color: #777;">Or copy and paste this link into your browser:<br/><a href="${inviteLink}" style="color: #277530;">${inviteLink}</a></p>
            </div>
          `,
        }

        try {
          await transporter.sendMail(mailOptions)
          console.log(`[AUTH] Trip invitation emailed to ${p.email}`)
        } catch (mailError) {
          console.error(`[AUTH] Failed to send trip invitation email to ${p.email}:`, mailError)
        }
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

// Update trip details (Organizer or Confirmed Participant)
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params
    const userID = req.userID

    const trip = await tripModel.findById(id)
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const updaterUser = await userModel.findById(userID)
    const updaterName = updaterUser?.name || 'A participant'

    const organizerIdStr = String(trip.organizer?._id || trip.organizer)
    const isOrganizer = organizerIdStr === String(userID)

    const isConfirmedParticipant = (trip.participants || []).some(
      (p) =>
        String(p.user?._id || p.user) === String(userID) &&
        (p.status === 'confirmed' || p.status === 'accepted')
    )

    if (!isOrganizer && !isConfirmedParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the organizer or confirmed trip members can update this trip.',
      })
    }

    // Is trip location/campsite already configured?
    const isConfigured = Boolean(trip.campsiteId || (trip.location && trip.location.trim() !== ''))

    // Fields that are locked once configured
    const LOCKED_FIELDS = ['location', 'campsiteId', 'coordinates']

    // Whitelist of fields organizer is allowed to edit
    const ORGANIZER_ALLOWED_FIELDS = [
      'name',
      'description',
      'startDate',
      'endDate',
      'meetingPoint',
      'meetingTime',
      'meetingCoordinates',
      'gear',
      'status',
      'location',
      'campsiteId',
      'coordinates',
    ]

    // Whitelist of fields participants (non-organizers) are allowed to edit
    const PARTICIPANT_ALLOWED_FIELDS = ['name', 'description', 'startDate', 'endDate', 'meetingPoint', 'meetingTime', 'meetingCoordinates']

    let updatePayload = {}

    if (isOrganizer) {
      const bodyKeys = Object.keys(req.body)
      const invalidKey = bodyKeys.find((key) => !ORGANIZER_ALLOWED_FIELDS.includes(key))
      if (invalidKey) {
        return res.status(400).json({
          success: false,
          message: `Updating property '${invalidKey}' is not permitted.`,
        })
      }

      const requestedBody = {}
      ORGANIZER_ALLOWED_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) {
          requestedBody[field] = req.body[field]
        }
      })

      if (isConfigured) {
        let attemptedLockedChange = false
        if (requestedBody.location !== undefined && requestedBody.location !== trip.location) {
          attemptedLockedChange = true
        }
        if (
          requestedBody.campsiteId !== undefined &&
          String(requestedBody.campsiteId || '') !== String(trip.campsiteId || '')
        ) {
          attemptedLockedChange = true
        }

        if (attemptedLockedChange) {
          return res.status(403).json({
            success: false,
            lockedField: true,
            message: 'Trip campsite or location is locked once configured and cannot be modified.',
          })
        }

        // Strip locked fields from payload
        LOCKED_FIELDS.forEach((field) => delete requestedBody[field])
      }

      updatePayload = requestedBody
    } else {
      const bodyKeys = Object.keys(req.body)
      const invalidKey = bodyKeys.find((key) => !PARTICIPANT_ALLOWED_FIELDS.includes(key))
      if (invalidKey) {
        return res.status(400).json({
          success: false,
          message: `Updating property '${invalidKey}' is not permitted.`,
        })
      }

      // Participant: strictly whitelist allowed fields ONLY
      PARTICIPANT_ALLOWED_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) {
          updatePayload[field] = req.body[field]
        }
      })
    }

    // Granular change tracking
    const changes = []
    const changeDescriptions = []

    if (updatePayload.name !== undefined && updatePayload.name !== trip.name) {
      changes.push({ field: 'name', oldVal: trip.name, newVal: updatePayload.name })
      changeDescriptions.push(`renamed trip from "${trip.name}" to "${updatePayload.name}"`)
    }

    if (updatePayload.description !== undefined && updatePayload.description !== trip.description) {
      changes.push({ field: 'description', oldVal: trip.description, newVal: updatePayload.description })
      changeDescriptions.push(`updated trip description`)
    }

    if (updatePayload.meetingPoint !== undefined && updatePayload.meetingPoint !== trip.meetingPoint) {
      changes.push({ field: 'meetingPoint', oldVal: trip.meetingPoint, newVal: updatePayload.meetingPoint })
      changeDescriptions.push(`changed meeting point to "${updatePayload.meetingPoint}"`)
    }

    if (updatePayload.meetingTime !== undefined && updatePayload.meetingTime !== trip.meetingTime) {
      changes.push({ field: 'meetingTime', oldVal: trip.meetingTime, newVal: updatePayload.meetingTime })
      changeDescriptions.push(`changed meeting time to "${updatePayload.meetingTime}"`)
    }

    if (updatePayload.startDate !== undefined) {
      const oldStart = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : ''
      const newStart = new Date(updatePayload.startDate).toISOString().split('T')[0]
      if (oldStart !== newStart) {
        changes.push({ field: 'startDate', oldVal: oldStart, newVal: newStart })
        changeDescriptions.push(`changed start date to ${newStart}`)
      }
    }

    if (updatePayload.endDate !== undefined) {
      const oldEnd = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : ''
      const newEnd = new Date(updatePayload.endDate).toISOString().split('T')[0]
      if (oldEnd !== newEnd) {
        changes.push({ field: 'endDate', oldVal: oldEnd, newVal: newEnd })
        changeDescriptions.push(`changed end date to ${newEnd}`)
      }
    }

    const updatedTrip = await tripModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate('organizer', 'name email')
      .populate('participants.user', 'name email')

    if (changes.length > 0 && updatedTrip) {
      const summaryText = `${updaterName} ${changeDescriptions.join(', ')}.`

      // Notify all other participants & organizer via DB notifications + SSE real-time events
      const allMembers = updatedTrip.participants || []
      // Include organizer if not in participants list
      const allMemberUserIds = new Set(
        allMembers
          .map((p) => String(p.user?._id || p.user))
          .filter((uid) => uid && uid !== 'null' && uid !== 'undefined')
      )
      allMemberUserIds.add(organizerIdStr)

      for (const memberId of allMemberUserIds) {
        if (memberId && memberId !== String(userID)) {
          // Save DB notification for offline delivery
          const notification = new notificationModel({
            user: memberId,
            title: `Trip Updated: ${updatedTrip.name}`,
            text: summaryText,
            color: 'blue',
            action: 'Trip updated',
            type: 'trip_update',
            relatedId: updatedTrip._id,
          })
          await notification.save().catch((e) => console.error('Error saving update notification:', e))

          // Emit real-time SSE event
          sseRegistry.sendToUser(memberId, 'trip_update', {
            tripId: updatedTrip._id,
            tripName: updatedTrip.name,
            updatedBy: updaterName,
            updatedById: userID,
            summary: summaryText,
            changes,
          })
        }
      }
    }

    res.json({
      success: true,
      message: 'Trip updated successfully',
      trip: updatedTrip,
      changes,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


// Delete trip (organizer only)
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params
    const userID = req.userID

    const trip = await tripModel.findById(id)
    if (!trip) {
      return res.json({ success: false, message: 'Trip not found' })
    }

    const organizerId = String(trip.organizer?._id || trip.organizer)
    if (organizerId !== String(userID)) {
      return res.json({ success: false, message: 'Only the trip organizer can delete this trip' })
    }

    await groupChecklistModel.deleteMany({ trip: id })
    await invitationModel.deleteMany({ trip: id })

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
            type: 'trip_deleted',
            relatedId: null,
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

// Invite participant by email
export const inviteParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.body
    const userID = req.userID

    if (!email) {
      return res.json({ success: false, message: 'Email address is required' })
    }

    const trip = await tripModel.findById(id)
    if (!trip) {
      return res.json({ success: false, message: 'Trip not found' })
    }

    if (String(trip.organizer) !== String(userID)) {
      return res.json({
        success: false,
        message: 'Only the trip creator (organizer) can invite participants to this trip.',
      })
    }

    const organizerUser = await userModel.findById(trip.organizer)
    const isPremium = isPremiumActive(organizerUser)
    if (!isPremium && trip.participants && trip.participants.length >= 10) {
      return res.json({
        success: false,
        limitReached: true,
        message: 'Free plan limit reached: Trips on the Free plan are limited to 10 total participants (1 organizer + 9 members). Upgrade to Premium to invite more participants.',
        upgradeUrl: '/pricing',
      })
    }

    const cleanEmail = email.toLowerCase().trim()


    const targetUser = await userModel.findOne({ email: cleanEmail })

    const alreadyInvited = trip.participants.some(
      (p) => (targetUser && p.user && String(p.user) === String(targetUser._id)) || p.email === cleanEmail
    )
    if (alreadyInvited) {
      return res.json({
        success: false,
        message: `${cleanEmail} is already a participant or invited to this trip.`,
      })
    }

    trip.participants.push({
      user: targetUser ? targetUser._id : null,
      email: cleanEmail,
      role: 'participant',
      status: 'pending',
    })
    await trip.save()

    const inviteCode = `${id.slice(-6)}-${crypto.randomInt(1000, 10000)}`
    const invitation = new invitationModel({
      trip: id,
      invitedBy: userID,
      email: cleanEmail,
      inviteCode,
      status: 'pending',
    })
    await invitation.save()

    if (targetUser) {
      const notification = new notificationModel({
        user: targetUser._id,
        title: `Trip Invitation: ${trip.name}`,
        text: `You have been invited by the organizer to join ${trip.name} in ${trip.location}.`,
        color: 'yellow',
        action: 'Invitation pending',
        type: 'invitation',
        relatedId: trip._id,
      })
      await notification.save()
    }

    // Send Email Invitation with Direct Link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'


    const inviteLink = `${clientUrl}/invite/${inviteCode}`
    const mailOptions = {
      from: process.env.SENDER_EMAIL || 'no-reply@camplify.com',
      to: cleanEmail,
      subject: `You're Invited to Join ${trip.name} on Camplify!`,
      text: `You have been invited by ${organizerUser?.name || 'a friend'} to join ${trip.name} in ${trip.location}.\n\nClick the link below to view and accept your invitation:\n${inviteLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; color: #333; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #277530; margin-top: 0;">Camping Trip Invitation</h2>
          <p>Hello!</p>
          <p><b>${organizerUser?.name || 'A fellow camper'}</b> invited you to join their camping trip:</p>
          <div style="background-color: #f4f9f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #277530;">${trip.name}</h3>
            <p style="margin: 4px 0; font-size: 14px; color: #555;"><b>Location:</b> ${trip.location}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #555;"><b>Dates:</b> ${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}</p>
          </div>
          <p>Click the button below to view the trip details and accept your invitation:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${inviteLink}" style="background-color: #277530; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View & Accept Invitation
            </a>
          </div>
          <p style="font-size: 12px; color: #777;">Or copy and paste this link into your browser:<br/><a href="${inviteLink}" style="color: #277530;">${inviteLink}</a></p>
        </div>
      `,
    }

    try {
      await transporter.sendMail(mailOptions)
      console.log(`[AUTH] Trip invitation emailed to ${cleanEmail}`)
    } catch (mailError) {
      console.error(`[AUTH] Failed to send trip invitation email to ${cleanEmail}:`, mailError)
    }


    const updatedTrip = await tripModel
      .findById(id)
      .populate('organizer', 'name email')
      .populate('participants.user', 'name email')

    res.json({
      success: true,
      message: `Invitation sent to ${targetUser ? targetUser.name : cleanEmail}!`,
      inviteCode,
      user: targetUser ? { name: targetUser.name, email: targetUser.email } : { email: cleanEmail },
      trip: updatedTrip,
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// ─── Download Offline Campsite Map (PDF) for a trip ──────────────────────────
export const getCampsiteMapForTrip = async (req, res) => {
  try {
    const userID = req.userID
    const { tripId } = req.params

    const trip = await tripModel
      .findById(tripId)
      .populate('organizer')
      .populate('campsiteId')

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const isOrganizer = String(trip.organizer?._id || trip.organizer) === String(userID)
    const currentUser = await userModel.findById(userID)
    const userEmail = (currentUser?.email || '').toLowerCase()

    const participantEntry = (trip.participants || []).find(
      (p) =>
        String(p.user?._id || p.user) === String(userID) ||
        (p.email && p.email.toLowerCase() === userEmail)
    )

    if (
      !isOrganizer &&
      (!participantEntry || (participantEntry.status !== 'confirmed' && participantEntry.status !== 'accepted'))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a confirmed trip member to download offline maps.',
      })
    }

    const isPremium = isPremiumActive(trip.organizer)
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. The trip organizer requires an active Premium membership to unlock offline campsite maps.',
      })
    }

    if (!trip.campsiteId) {
      return res.status(404).json({
        success: false,
        message: 'No official campsite is linked to this trip.',
      })
    }

    const campsite = trip.campsiteId
    if (!campsite.offlineMapKey) {
      return res.status(404).json({
        success: false,
        message: 'No offline map document is available for this campsite yet.',
      })
    }

    const safeFilename = `${campsite.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Offline_Map.pdf`
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`)
    res.setHeader('Content-Type', 'application/pdf')

    await streamObjectFromOracleStorage(campsite.offlineMapKey, res)
  } catch (error) {

    console.error('[getCampsiteMapForTrip Error]:', error)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to download offline map.' })
    }
  }
}

