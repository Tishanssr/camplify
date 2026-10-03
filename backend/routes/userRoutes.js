import express from 'express'
import multer from 'multer'
import userAuth from '../middleware/userAuth.js'
import adminAuth from '../middleware/adminAuth.js'
import {
  getUserData,
  checkUserEmail,
  updateUserProfile,
  uploadAvatar,
  getPublicProfile,
  setPremiumStatus,
} from '../controllers/userController.js'

const userRouter = express.Router()

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed.'))
    }
  },
})

userRouter.get('/data', userAuth, getUserData)
userRouter.get('/check-email', userAuth, checkUserEmail)
userRouter.put('/profile', userAuth, updateUserProfile)
userRouter.post('/avatar', userAuth, avatarUpload.single('avatar'), uploadAvatar)
userRouter.get('/profile/:userId', userAuth, getPublicProfile)
userRouter.post('/admin/set-premium', userAuth, adminAuth, setPremiumStatus)

export default userRouter