import express from 'express'
import jwt from 'jsonwebtoken'
import userAuth from '../middleware/userAuth.js'
import {
  acceptInviteByCode,
  clearRespondedInvitations,
  deleteInvitation,
  getInviteByCode,
  getUserInvitations,
  respondInvitation,
} from '../controllers/invitationController.js'

const optionalAuth = (req, res, next) => {
  let token = req.cookies?.token
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (decoded?.id) req.userID = decoded.id
    } catch {
      // ignore invalid token for public preview
    }
  }
  next()
}

const invitationRouter = express.Router()

invitationRouter.get('/', userAuth, getUserInvitations)
invitationRouter.get('/code/:code', optionalAuth, getInviteByCode)
invitationRouter.post('/:id/respond', userAuth, respondInvitation)
invitationRouter.post('/code/:code', userAuth, acceptInviteByCode)
invitationRouter.delete('/clear/responded', userAuth, clearRespondedInvitations)
invitationRouter.delete('/:id', userAuth, deleteInvitation)

export default invitationRouter


