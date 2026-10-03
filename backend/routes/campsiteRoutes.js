import express from 'express'
import multer from 'multer'
import {
  getCampsites,
  getCampsiteById,
  createCampsite,
  updateCampsite,
  deleteCampsite,
} from '../controllers/campsiteController.js'
import userAuth from '../middleware/userAuth.js'
import adminAuth from '../middleware/adminAuth.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 10, // Max 10 total files per upload
  },
  fileFilter: (req, file, cb) => {
    if (
      file.fieldname === 'offlineMapPdf' ||
      file.mimetype === 'application/pdf' ||
      /\.pdf$/i.test(file.originalname)
    ) {
      if (file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname)) {
        cb(null, true)
      } else {
        cb(new Error('Offline map file must be a PDF document (.pdf).'))
      }
    } else {
      const isJpgMime = file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg'
      const isJpgExt = /\.(jpg|jpeg)$/i.test(file.originalname)
      if (isJpgMime || isJpgExt) {
        cb(null, true)
      } else {
        cb(new Error('Only JPG (.jpg, .jpeg) images and PDF (.pdf) map files are allowed.'))
      }
    }
  },
})

// Middleware wrapper to return clean JSON error response on file format errors
const handleUpload = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error.',
      })
    }
    next()
  })
}


const campsiteRouter = express.Router()

const campsiteUploadFields = upload.fields([
  { name: 'photos', maxCount: 8 },
  { name: 'offlineMapPdf', maxCount: 1 },
])

// Public read routes
campsiteRouter.get('/', getCampsites)
campsiteRouter.get('/:id', getCampsiteById)

// Admin management routes
campsiteRouter.post('/', userAuth, adminAuth, handleUpload(campsiteUploadFields), createCampsite)
campsiteRouter.put('/:id', userAuth, adminAuth, handleUpload(campsiteUploadFields), updateCampsite)
campsiteRouter.delete('/:id', userAuth, adminAuth, deleteCampsite)

export default campsiteRouter
