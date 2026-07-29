import express from 'express'
import { getWeather } from '../controllers/weatherController.js'

const weatherRouter = express.Router()

weatherRouter.get('/', getWeather)

export default weatherRouter
