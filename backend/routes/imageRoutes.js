import express from 'express'
import { serveImage } from '../controllers/imageController.js'

const imageRouter = express.Router()

// Public proxy route — serves private OCI objects by folder + filename
// e.g. GET /api/images/campsites/1727700000_abc.jpg
// e.g. GET /api/images/avatars/1727700000_xyz.jpg
imageRouter.get('/:folder/:filename', serveImage)

export default imageRouter
