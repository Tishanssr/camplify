import express from 'express'
import userAuth from '../middleware/userAuth.js'
import {
  acceptInviteByCode,
  clearRespondedInvitations,
  deleteInvitation,
  getUserInvitations,
  respondInvitation,
} from '../controllers/invitationController.js'

const invitationRouter = express.Router()

invitationRouter.get('/', userAuth, getUserInvitations)
invitationRouter.post('/:id/respond', userAuth, respondInvitation)
invitationRouter.post('/code/:code', userAuth, acceptInviteByCode)
invitationRouter.delete('/clear/responded', userAuth, clearRespondedInvitations)
invitationRouter.delete('/:id', userAuth, deleteInvitation)

export default invitationRouter

