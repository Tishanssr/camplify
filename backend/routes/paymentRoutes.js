import express from 'express'
import userAuth from '../middleware/userAuth.js'
import { initiatePayment, payhereNotify } from '../controllers/paymentController.js'

const paymentRouter = express.Router()

paymentRouter.post('/initiate-checkout', userAuth, initiatePayment)
paymentRouter.post('/payhere-notify', payhereNotify)

export default paymentRouter
