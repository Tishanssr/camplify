import express from 'express'
import userAuth from '../middleware/userAuth.js'
import { getWeather } from '../controllers/weatherController.js'

const weatherRouter = express.Router()

weatherRouter.get('/', userAuth, getWeather)

export default weatherRouter

