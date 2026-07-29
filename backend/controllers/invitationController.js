import invitationModel from '../model/invitationModel.js'
import tripModel from '../model/tripModel.js'
import userModel from '../model/userModel.js'
import notificationModel from '../model/notificationModel.js'

// Get all invitations for current logged-in user
export const getUserInvitations = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    const invitations = await invitationModel
      .find({
        $or: [{ email: user.email.toLowerCase() }, { invitedBy: userID }],
      })
      .populate('trip')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, invitations })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Respond to an invitation (accept or reject)
export const respondInvitation = async (req, res) => {
  try {
    const userID = req.userID
    const { id } = req.params
    const { status, action } = req.body // 'accepted' | 'rejected' | 'declined'

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

    // Verify recipient matches user email
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.json({ success: false, message: 'You are not authorized to respond to this invitation.' })
    }

    invitation.status = targetStatus
    await invitation.save()

    // Update trip participant status
    if (invitation.trip) {
      const trip = await tripModel.findById(invitation.trip._id || invitation.trip)
      if (trip) {
        if (targetStatus === 'rejected') {
          // If declined, completely remove the user from trip.participants list
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

    // Push notification to organizer
    if (invitation.invitedBy) {
      const notifText = targetStatus === 'accepted'
        ? `${user.name} accepted your invitation to join ${invitation.trip?.name || 'the trip'}!`
        : `${user.name} declined the invitation to join ${invitation.trip?.name || 'the trip'}.`

      const notification = new notificationModel({
        user: invitation.invitedBy,
        title: targetStatus === 'accepted' ? 'Invitation Accepted 🎉' : 'Invitation Declined',
        text: notifText,
        color: targetStatus === 'accepted' ? 'green' : 'yellow',
      })
      await notification.save()
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

// Accept trip by invite code or direct link
export const acceptInviteByCode = async (req, res) => {
  try {
    const userID = req.userID
    const { code } = req.params

    const user = await userModel.findById(userID)
    const invitation = await invitationModel.findOne({ inviteCode: code }).populate('trip')

    if (!invitation) {
      return res.json({ success: false, message: 'Invalid or expired invite link.' })
    }

    invitation.status = 'accepted'
    await invitation.save()

    const trip = await tripModel.findById(invitation.trip._id || invitation.trip)
    if (trip) {
      const existing = trip.participants.find((p) => String(p.user) === String(userID))
      if (existing) {
        existing.status = 'confirmed'
      } else {
        trip.participants.push({
          user: userID,
          email: user.email.toLowerCase(),
          role: 'participant',
          status: 'confirmed',
        })
      }
      await trip.save()
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
