import invitationModel from '../model/invitationModel.js'
import tripModel from '../model/tripModel.js'
import userModel from '../model/userModel.js'
import notificationModel from '../model/notificationModel.js'
import campsiteModel from '../model/campsiteModel.js'

// User invitations lookup
export const getUserInvitations = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    const invitations = await invitationModel
      .find({ email: user.email.toLowerCase() })
      .populate('trip')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, invitations })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Respond to trip invitation
export const respondInvitation = async (req, res) => {
  try {
    const userID = req.userID
    const { id } = req.params
    const { status, action } = req.body

    let targetStatus = status || (action === 'accept' ? 'accepted' : 'rejected')
    if (targetStatus === 'declined') targetStatus = 'rejected'

    if (!['accepted', 'rejected'].includes(targetStatus)) {
      return res.json({ success: false, message: 'Invalid response status. Must be accepted or rejected.' })
    }

    const user = await userModel.findById(userID)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    const invitation = await invitationModel.findById(id).populate('trip')
    if (!invitation) {
      return res.json({ success: false, message: 'Invitation not found' })
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.json({ success: false, message: 'You are not authorized to respond to this invitation.' })
    }

    invitation.status = targetStatus
    await invitation.save()

    if (invitation.trip) {
      const trip = await tripModel.findById(invitation.trip._id || invitation.trip)
      if (trip) {
        if (targetStatus === 'rejected') {
          trip.participants = trip.participants.filter(
            (p) => String(p.user) !== String(userID) && (p.email || '').toLowerCase() !== user.email.toLowerCase()
          )
        } else if (targetStatus === 'accepted') {
          const participant = trip.participants.find(
            (p) => String(p.user) === String(userID) || (p.email || '').toLowerCase() === user.email.toLowerCase()
          )

          if (participant) {
            participant.user = userID
            participant.status = 'confirmed'
          } else {
            trip.participants.push({
              user: userID,
              email: user.email.toLowerCase(),
              role: 'participant',
              status: 'confirmed',
            })
          }
        }
        await trip.save()
      }
    }

    // Send notification to Organizer & Inviter
    const recipientIds = new Set()
    if (invitation.invitedBy) {
      recipientIds.add(String(invitation.invitedBy._id || invitation.invitedBy))
    }
    const tripObj = invitation.trip || (await tripModel.findById(invitation.trip))
    if (tripObj && tripObj.organizer) {
      recipientIds.add(String(tripObj.organizer._id || tripObj.organizer))
    }
    recipientIds.delete(String(userID))

    const notifText = targetStatus === 'accepted'
      ? `${user.name} accepted the invitation to join ${tripObj?.name || 'the trip'}!`
      : `${user.name} declined the invitation to join ${tripObj?.name || 'the trip'}.`

    for (const recipientId of recipientIds) {
      const notification = new notificationModel({
        user: recipientId,
        title: targetStatus === 'accepted' ? 'Invitation Accepted' : 'Invitation Declined',
        text: notifText,
        color: targetStatus === 'accepted' ? 'green' : 'yellow',
        type: 'invitation_response',
        relatedId: tripObj?._id || invitation.trip?._id || invitation.trip || null,
      })
      await notification.save().catch((err) => console.error('Error saving invitation notification:', err))
    }

    res.json({
      success: true,
      message: targetStatus === 'accepted'
        ? `Invitation accepted! You joined ${invitation.trip?.name || 'the trip'}.`
        : `Invitation declined.`,
      invitation,
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get invitation & trip details by invite code (public/optional auth)
export const getInviteByCode = async (req, res) => {
  try {
    const { code } = req.params
    const userID = req.userID || null

    const invitation = await invitationModel
      .findOne({ inviteCode: code })
      .populate({
        path: 'trip',
        populate: [
          { path: 'organizer', select: 'name email' },
          { path: 'campsiteId', select: 'image images name location' },
        ],
      })
      .populate('invitedBy', 'name email')

    if (!invitation || !invitation.trip) {
      return res.json({ success: false, message: 'Invalid or expired invitation link.' })
    }

    const trip = invitation.trip
    let currentUserStatus = null
    let isAlreadyParticipant = false
    let currentUserEmail = null

    if (userID) {
      const user = await userModel.findById(userID)
      if (user) {
        currentUserEmail = user.email
        const participant = trip.participants.find(
          (p) => (p.user && String(p.user) === String(userID)) || (p.email && p.email.toLowerCase() === user.email.toLowerCase())
        )
        if (participant) {
          isAlreadyParticipant = participant.status === 'confirmed'
          currentUserStatus = participant.status
        }
      }
    }

    const resolvedImage = trip.image || trip.campsiteId?.images?.[0] || trip.campsiteId?.image || null

    res.json({
      success: true,
      invitation: {
        _id: invitation._id,
        inviteCode: invitation.inviteCode,
        status: invitation.status,
        email: invitation.email,
        invitedBy: invitation.invitedBy,
      },
      trip: {
        _id: trip._id,
        name: trip.name,
        description: trip.description,
        location: trip.location,
        startDate: trip.startDate,
        endDate: trip.endDate,
        meetingPoint: trip.meetingPoint,
        organizer: trip.organizer,
        campsiteId: trip.campsiteId,
        image: resolvedImage,
      },
      userState: {
        isLoggedIn: !!userID,
        currentUserEmail,
        isAlreadyParticipant,
        currentUserStatus,
      },
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Accept trip via invite code
export const acceptInviteByCode = async (req, res) => {
  try {
    const userID = req.userID
    const { code } = req.params

    const user = await userModel.findById(userID)
    if (!user) {
      return res.json({ success: false, message: 'User not found. Please log in.' })
    }

    const invitation = await invitationModel.findOne({ inviteCode: code }).populate('trip')

    if (!invitation) {
      return res.json({ success: false, message: 'Invalid or expired invite link.' })
    }

    invitation.status = 'accepted'
    await invitation.save()

    const trip = await tripModel.findById(invitation.trip._id || invitation.trip)
    if (trip) {
      const userEmailLower = user.email.toLowerCase()
      const inviteEmailLower = (invitation.email || '').toLowerCase()

      // Find existing participant by priority: userID -> currentUser.email -> invitation.email
      let existing = trip.participants.find((p) => p.user && String(p.user) === String(userID))
      if (!existing && userEmailLower) {
        existing = trip.participants.find((p) => p.email && p.email.toLowerCase() === userEmailLower)
      }
      if (!existing && inviteEmailLower) {
        existing = trip.participants.find((p) => p.email && p.email.toLowerCase() === inviteEmailLower)
      }

      if (existing) {
        existing.user = userID
        existing.email = userEmailLower
        existing.status = 'confirmed'
      } else {
        trip.participants.push({
          user: userID,
          email: userEmailLower,
          role: 'participant',
          status: 'confirmed',
        })
      }
      await trip.save()

      // Send notification to Organizer & Inviter
      const recipientIds = new Set()
      if (invitation.invitedBy) {
        recipientIds.add(String(invitation.invitedBy._id || invitation.invitedBy))
      }
      if (trip.organizer) {
        recipientIds.add(String(trip.organizer._id || trip.organizer))
      }
      recipientIds.delete(String(userID))

      const notifText = `${user.name} accepted the invitation to join ${trip.name}!`

      for (const recipientId of recipientIds) {
        const notification = new notificationModel({
          user: recipientId,
          title: 'Invitation Accepted',
          text: notifText,
          color: 'green',
          type: 'invitation_response',
          relatedId: trip._id,
        })
        await notification.save().catch((err) => console.error('Error saving invitation notification:', err))
      }
    }

    res.json({
      success: true,
      message: `Successfully joined ${trip ? trip.name : 'the trip'}!`,
      tripId: trip ? trip._id : null,
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Remove invitation notification
export const deleteInvitation = async (req, res) => {
  try {
    const userID = req.userID
    const { id } = req.params
    const user = await userModel.findById(userID)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    const invitation = await invitationModel.findById(id)
    if (!invitation) {
      return res.json({ success: false, message: 'Invitation not found' })
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase() && String(invitation.invitedBy) !== String(userID)) {
      return res.json({ success: false, message: 'Unauthorized to delete this invitation' })
    }

    await invitationModel.findByIdAndDelete(id)
    res.json({ success: true, message: 'Invitation deleted successfully' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Clear responded invitations
export const clearRespondedInvitations = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)
    if (user) {
      await invitationModel.deleteMany({
        email: user.email.toLowerCase(),
        status: { $in: ['accepted', 'rejected'] },
      })
    }
    res.json({ success: true, message: 'Responded invitations cleared successfully' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

