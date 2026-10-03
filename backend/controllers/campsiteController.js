import campsiteModel from '../model/campsiteModel.js'
import { uploadToOracleStorage, deleteFromOracleStorage } from '../config/ociStorageService.js'

// Helper to escape regex special characters
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const formatCampsiteForPublic = (campsite) => {
  if (!campsite) return null
  const obj = campsite.toObject ? campsite.toObject() : { ...campsite }
  obj.hasOfflineMap = Boolean(obj.offlineMapKey && obj.offlineMapKey.trim())
  delete obj.offlineMapKey
  return obj
}

export const getCampsites = async (req, res) => {
  try {
    const { search } = req.query
    let query = {}

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim())
      const regex = new RegExp(safeSearch, 'i')
      query = {
        $or: [
          { name: regex },
          { location: regex },
          { tags: regex },
        ],
      }
    }

    const campsites = await campsiteModel.find(query).sort({ createdAt: -1 })
    res.json({ success: true, campsites: campsites.map(formatCampsiteForPublic) })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getCampsiteById = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || !id.trim()) {
      return res.status(400).json({ success: false, message: 'ID or name parameter is required' })
    }

    const cleanId = id.trim()
    let campsite = null

    // Try lookup by MongoDB ObjectId, fallback to exact name match
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      campsite = await campsiteModel.findById(cleanId)
    }

    if (!campsite) {
      const safeName = escapeRegex(cleanId)
      campsite = await campsiteModel.findOne({ name: new RegExp(`^${safeName}$`, 'i') })
    }

    if (!campsite) {
      return res.status(404).json({ success: false, message: 'Campsite not found' })
    }

    res.json({ success: true, campsite: formatCampsiteForPublic(campsite) })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


// Admin: Create Campsite
export const createCampsite = async (req, res) => {
  try {
    const { name, location, description, distance, tags, image, existingImages, lat, lng } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Campsite name is required' })
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Location is required' })
    }

    const uploadedUrls = []
    let offlineMapKey = ''

    // Process all uploaded files from req.files or req.file
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : (req.file ? [req.file] : [])
    for (const file of files) {
      if (
        file.fieldname === 'offlineMapPdf' ||
        file.mimetype === 'application/pdf' ||
        /\.pdf$/i.test(file.originalname)
      ) {
        const pdfKey = await uploadToOracleStorage(file.buffer, file.originalname, 'application/pdf', 'campsite-maps')
        if (pdfKey) offlineMapKey = pdfKey
      } else {
        const objectKey = await uploadToOracleStorage(file.buffer, file.originalname, file.mimetype, 'campsites')
        if (objectKey) {
          const filename = objectKey.split('/').pop()
          uploadedUrls.push(`/api/images/campsites/${filename}`)
        }
      }
    }

    let parsedExisting = []
    if (Array.isArray(existingImages)) {
      parsedExisting = existingImages
    } else if (typeof existingImages === 'string' && existingImages.trim()) {
      try {
        parsedExisting = JSON.parse(existingImages)
      } catch {
        parsedExisting = existingImages.split(',').map((u) => u.trim()).filter(Boolean)
      }
    }

    const allImages = [...parsedExisting, ...uploadedUrls]
    if (allImages.length === 0 && image && image.trim()) {
      allImages.push(image.trim())
    }

    const parseTagsInput = (input) => {
      let result = []
      if (Array.isArray(input)) {
        result = input.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
      } else if (typeof input === 'string' && input.trim()) {
        try {
          const parsed = JSON.parse(input)
          if (Array.isArray(parsed)) {
            result = parsed.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
          } else {
            result = input.split(',').map((t) => t.trim()).filter(Boolean)
          }
        } catch {
          result = input.split(',').map((t) => t.trim()).filter(Boolean)
        }
      }
      return result
    }

    let parsedTags = parseTagsInput(tags)
    if (parsedTags.length === 0) {
      parsedTags = ['Camping', 'Nature']
    }

    let coordinates = undefined
    if (lat !== undefined && lng !== undefined && lat !== '' && lng !== '') {
      coordinates = { lat: Number(lat), lng: Number(lng) }
    } else if (req.body.coordinates) {
      coordinates = typeof req.body.coordinates === 'string' ? JSON.parse(req.body.coordinates) : req.body.coordinates
    }

    const primaryImage = allImages[0] || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'

    const newCampsite = new campsiteModel({
      name: name.trim(),
      location: location.trim(),
      description: description ? description.trim() : '',
      distance: distance ? distance.trim() : 'Nearby',
      tags: parsedTags,
      image: primaryImage,
      images: allImages.length > 0 ? allImages : [primaryImage],
      coordinates,
      offlineMapKey: offlineMapKey || '',
    })

    await newCampsite.save()
    res.status(201).json({ success: true, message: 'Campsite created successfully', campsite: formatCampsiteForPublic(newCampsite) })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Update Campsite
export const updateCampsite = async (req, res) => {
  try {
    const { id } = req.params
    const { name, location, description, distance, tags, image, existingImages, lat, lng, removePdf } = req.body

    const campsite = await campsiteModel.findById(id)
    if (!campsite) {
      return res.status(404).json({ success: false, message: 'Campsite not found' })
    }

    if (name !== undefined) campsite.name = name.trim()
    if (location !== undefined) campsite.location = location.trim()
    if (description !== undefined) campsite.description = description.trim()
    if (distance !== undefined) campsite.distance = distance.trim()

    if (tags !== undefined) {
      let updatedTags = []
      if (Array.isArray(tags)) {
        updatedTags = tags.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
      } else if (typeof tags === 'string' && tags.trim()) {
        try {
          const parsed = JSON.parse(tags)
          if (Array.isArray(parsed)) {
            updatedTags = parsed.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
          } else {
            updatedTags = tags.split(',').map((t) => t.trim()).filter(Boolean)
          }
        } catch {
          updatedTags = tags.split(',').map((t) => t.trim()).filter(Boolean)
        }
      }
      if (updatedTags.length > 0) {
        campsite.tags = updatedTags
      }
    }

    // Handle PDF removal if requested
    if (removePdf === 'true' || removePdf === true) {
      if (campsite.offlineMapKey) {
        await deleteFromOracleStorage(campsite.offlineMapKey)
      }
      campsite.offlineMapKey = ''
    }

    // Process new file uploads
    const uploadedUrls = []
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : (req.file ? [req.file] : [])
    for (const file of files) {
      if (
        file.fieldname === 'offlineMapPdf' ||
        file.mimetype === 'application/pdf' ||
        /\.pdf$/i.test(file.originalname)
      ) {
        if (campsite.offlineMapKey) {
          await deleteFromOracleStorage(campsite.offlineMapKey)
        }
        const pdfKey = await uploadToOracleStorage(file.buffer, file.originalname, 'application/pdf', 'campsite-maps')
        if (pdfKey) campsite.offlineMapKey = pdfKey
      } else {
        const objectKey = await uploadToOracleStorage(file.buffer, file.originalname, file.mimetype, 'campsites')
        if (objectKey) {
          const filename = objectKey.split('/').pop()
          uploadedUrls.push(`/api/images/campsites/${filename}`)
        }
      }
    }

    let parsedExisting = null
    if (existingImages !== undefined) {
      if (Array.isArray(existingImages)) {
        parsedExisting = existingImages
      } else if (typeof existingImages === 'string') {
        try {
          parsedExisting = JSON.parse(existingImages)
        } catch {
          parsedExisting = existingImages.split(',').map((u) => u.trim()).filter(Boolean)
        }
      }
    }

    if (parsedExisting !== null) {
      const oldImages = campsite.images || (campsite.image ? [campsite.image] : [])
      const removedImages = oldImages.filter((oldUrl) => !parsedExisting.includes(oldUrl))
      for (const removedUrl of removedImages) {
        await deleteFromOracleStorage(removedUrl)
      }
    }

    if (parsedExisting !== null || uploadedUrls.length > 0) {
      const currentImages = parsedExisting !== null ? parsedExisting : (campsite.images || [campsite.image])
      const combinedImages = [...currentImages, ...uploadedUrls].filter(Boolean)
      
      if (combinedImages.length > 0) {
        campsite.images = combinedImages
        campsite.image = combinedImages[0]
      }
    } else if (image !== undefined && image.trim()) {
      campsite.image = image.trim()
      if (!campsite.images || campsite.images.length === 0) {
        campsite.images = [image.trim()]
      }
    }

    if (lat !== undefined && lng !== undefined && lat !== '' && lng !== '') {
      campsite.coordinates = { lat: Number(lat), lng: Number(lng) }
    } else if (req.body.coordinates) {
      campsite.coordinates = typeof req.body.coordinates === 'string' ? JSON.parse(req.body.coordinates) : req.body.coordinates
    }

    await campsite.save()
    res.json({ success: true, message: 'Campsite updated successfully', campsite: formatCampsiteForPublic(campsite) })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Delete Campsite
export const deleteCampsite = async (req, res) => {
  try {
    const { id } = req.params

    const campsite = await campsiteModel.findById(id)
    if (!campsite) {
      return res.status(404).json({ success: false, message: 'Campsite not found' })
    }

    // Delete offline PDF map if it exists
    if (campsite.offlineMapKey) {
      await deleteFromOracleStorage(campsite.offlineMapKey)
    }

    // Collect all image URLs associated with this campsite
    const imagesToDelete = []
    if (campsite.images && Array.isArray(campsite.images)) {
      imagesToDelete.push(...campsite.images)
    }
    if (campsite.image) {
      imagesToDelete.push(campsite.image)
    }

    // Delete associated images from Oracle Cloud Object Storage bucket
    const uniqueUrls = [...new Set(imagesToDelete)].filter(Boolean)
    for (const url of uniqueUrls) {
      await deleteFromOracleStorage(url)
    }

    // Delete campsite document from database
    await campsiteModel.findByIdAndDelete(id)

    res.json({ success: true, message: 'Campsite and associated storage assets deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

