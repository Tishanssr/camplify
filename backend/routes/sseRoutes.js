import express from 'express'
import userAuth from '../middleware/userAuth.js'
import { subscribeSSE } from '../controllers/sseController.js'

const sseRouter = express.Router()

sseRouter.get('/stream', userAuth, subscribeSSE)

export default sseRouter
