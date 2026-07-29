import express from 'express'
import { getCampsiteById, getCampsites } from '../controllers/campsiteController.js'

const campsiteRouter = express.Router()

campsiteRouter.get('/', getCampsites)
campsiteRouter.get('/:id', getCampsiteById)

export default campsiteRouter
