import express from 'express'
import userAuth from '../middleware/userAuth.js'
import {
  addGroupItem,
  assignGroupItem,
  deleteGroupItem,
  editGroupItem,
  getGroupChecklist,
  toggleGroupItem,
} from '../controllers/checklistController.js'

const checklistRouter = express.Router()

checklistRouter.get('/group/:tripId', userAuth, getGroupChecklist)
checklistRouter.post('/group/:tripId/item', userAuth, addGroupItem)
checklistRouter.put('/group/:tripId/item/:itemId', userAuth, editGroupItem)
checklistRouter.patch('/group/:tripId/item/:itemId', userAuth, toggleGroupItem)
checklistRouter.post('/group/:tripId/item/:itemId/assign', userAuth, assignGroupItem)
checklistRouter.delete('/group/:tripId/item/:itemId', userAuth, deleteGroupItem)

export default checklistRouter
