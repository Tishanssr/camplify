import express from 'express'
import userAuth from '../middleware/userAuth.js'
import {
  addPersonalItem,
  deletePersonalItem,
  getGroupChecklist,
  getPersonalChecklist,
  togglePersonalItem,
} from '../controllers/checklistController.js'

const checklistRouter = express.Router()

checklistRouter.get('/personal', userAuth, getPersonalChecklist)
checklistRouter.post('/personal', userAuth, addPersonalItem)
checklistRouter.patch('/personal/:itemId', userAuth, togglePersonalItem)
checklistRouter.delete('/personal/:itemId', userAuth, deletePersonalItem)
checklistRouter.get('/group/:tripId', userAuth, getGroupChecklist)

export default checklistRouter
