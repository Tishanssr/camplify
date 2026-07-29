import express from 'express'
import userAuth from '../middleware/userAuth.js'
import { getNotifications, markAllRead, markAsRead, deleteNotification, clearAllNotifications } from '../controllers/notificationController.js'

const notificationRouter = express.Router()

notificationRouter.get('/', userAuth, getNotifications)
notificationRouter.patch('/read-all', userAuth, markAllRead)
notificationRouter.patch('/:id/read', userAuth, markAsRead)
notificationRouter.delete('/clear-all', userAuth, clearAllNotifications)
notificationRouter.delete('/:id', userAuth, deleteNotification)

export default notificationRouter
