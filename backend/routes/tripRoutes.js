import express from 'express'
import userAuth from '../middleware/userAuth.js'
import { createTrip, deleteTrip, getTripById, getTrips, inviteParticipant, updateTrip } from '../controllers/tripController.js'

const tripRouter = express.Router()

tripRouter.get('/', userAuth, getTrips)
tripRouter.get('/:id', userAuth, getTripById)
tripRouter.post('/', userAuth, createTrip)
tripRouter.post('/:id/invite', userAuth, inviteParticipant)
tripRouter.put('/:id', userAuth, updateTrip)
tripRouter.delete('/:id', userAuth, deleteTrip)

export default tripRouter
