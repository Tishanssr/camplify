import notificationModel from '../model/notificationModel.js'
import invitationModel from '../model/invitationModel.js'
import userModel from '../model/userModel.js'

export const getNotifications = async (req, res) => {
  try {
    const userID = req.userID
    const notifications = await notificationModel.find({ user: userID }).sort({ createdAt: -1 })
    res.json({ success: true, notifications })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getUnreadCount = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)

    const unreadNotifCount = await notificationModel.countDocuments({ user: userID, read: false })

    let unreadInviteCount = 0
    if (user && user.email) {
      unreadInviteCount = await invitationModel.countDocuments({
        email: user.email.toLowerCase(),
        status: 'pending',
        read: { $ne: true },
      })
    }

    const totalUnread = unreadNotifCount + unreadInviteCount
    res.json({ success: true, count: totalUnread, unreadNotifications: unreadNotifCount, unreadInvitations: unreadInviteCount })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const markAllRead = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)

    await notificationModel.updateMany({ user: userID }, { read: true })
    if (user && user.email) {
      await invitationModel.updateMany({ email: user.email.toLowerCase() }, { read: true })
    }

    res.json({ success: true, message: 'All notifications and invitations marked as read' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)
    const { id } = req.params

    const cleanId = String(id).startsWith('inv-') ? String(id).replace('inv-', '') : id

    const updatedNotif = await notificationModel.findOneAndUpdate({ _id: cleanId, user: userID }, { read: true })
    if (!updatedNotif && user && user.email) {
      await invitationModel.findOneAndUpdate({ _id: cleanId, email: user.email.toLowerCase() }, { read: true })
    }

    res.json({ success: true, message: 'Marked as read' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const deleteNotification = async (req, res) => {
  try {
    const userID = req.userID
    const { id } = req.params
    await notificationModel.findOneAndDelete({ _id: id, user: userID })
    res.json({ success: true, message: 'Notification cleared' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const clearAllNotifications = async (req, res) => {
  try {
    const userID = req.userID
    await notificationModel.deleteMany({ user: userID })
    res.json({ success: true, message: 'All notifications cleared' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
