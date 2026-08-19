import campsiteModel from '../model/campsiteModel.js'

// Helper to escape regex special characters
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

    const campsites = await campsiteModel.find(query)
    res.json({ success: true, campsites })
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

    // 1. Try finding by MongoDB ObjectId
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      campsite = await campsiteModel.findById(cleanId)
    }

    // 2. Fallback: Try finding by exact campsite name (case-insensitive)
    if (!campsite) {
      const safeName = escapeRegex(cleanId)
      campsite = await campsiteModel.findOne({ name: new RegExp(`^${safeName}$`, 'i') })
    }

    if (!campsite) {
      return res.status(404).json({ success: false, message: 'Campsite not found' })
    }

    res.json({ success: true, campsite })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
