import express from 'express'
import userAuth from '../middleware/userAuth.js'
import { acceptInviteByCode, getUserInvitations, respondInvitation } from '../controllers/invitationController.js'

const invitationRouter = express.Router()

invitationRouter.get('/', userAuth, getUserInvitations)
invitationRouter.post('/:id/respond', userAuth, respondInvitation)
invitationRouter.post('/code/:code', userAuth, acceptInviteByCode)

export default invitationRouter
