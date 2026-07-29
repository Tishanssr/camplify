import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'

import connectDb from './config/mongodb.js'
import authRouter from './routes/authRoutes.js'
import userRouter from './routes/userRoutes.js'
import tripRouter from './routes/tripRoutes.js'
import checklistRouter from './routes/checklistRoutes.js'
import notificationRouter from './routes/notificationRoutes.js'
import campsiteRouter from './routes/campsiteRoutes.js'
import weatherRouter from './routes/weatherRoutes.js'
import invitationRouter from './routes/invitationRoutes.js'

const app = express()
const port = process.env.PORT || 4000

// Connect to MongoDB Database
connectDb()

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://camplify-production.up.railway.app'],
    credentials: true,
  })
)

// API Endpoints
app.get('/', (req, res) => res.send('Camplify API Working'))
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/trips', tripRouter)
app.use('/api/checklists', checklistRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/campsites', campsiteRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/invitations', invitationRouter)

app.listen(port, () => console.log(`Server started on port:${port}`))