import notificationModel from '../model/notificationModel.js'

export const getNotifications = async (req, res) => {
  try {
    const userID = req.userID
    const notifications = await notificationModel.find({ user: userID }).sort({ createdAt: -1 })
    res.json({ success: true, notifications })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const markAllRead = async (req, res) => {
  try {
    const userID = req.userID
    await notificationModel.updateMany({ user: userID }, { read: true })
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const userID = req.userID
    const { id } = req.params
    await notificationModel.findOneAndUpdate({ _id: id, user: userID }, { read: true })
    res.json({ success: true, message: 'Notification marked as read' })
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
