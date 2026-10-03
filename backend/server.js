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
import imageRouter from './routes/imageRoutes.js'
import paymentRouter from './routes/paymentRoutes.js'
import sseRouter from './routes/sseRoutes.js'

const app = express()
const port = process.env.PORT || 4000

// DB connection
connectDb()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://camplify-mauve.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true,
  })
)


// Routes
app.get('/', (req, res) => res.send('Camplify API Working'))
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/trips', tripRouter)
app.use('/api/checklists', checklistRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/campsites', campsiteRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/invitations', invitationRouter)
app.use('/api/images', imageRouter)
app.use('/api/payments', paymentRouter)
app.use('/api/sse', sseRouter)


app.listen(port, () => console.log(`Server started on port:${port}`))