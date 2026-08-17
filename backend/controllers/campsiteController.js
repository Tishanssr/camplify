import campsiteModel from '../model/campsiteModel.js'

export const getCampsites = async (req, res) => {
  try {
    const { search } = req.query
    let query = {}
    if (search) {
      const regex = new RegExp(search.trim(), 'i')
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
    res.json({ success: false, message: error.message })
  }
}

export const getCampsiteById = async (req, res) => {
  try {
    const { id } = req.params
    let campsite = null
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      campsite = await campsiteModel.findById(id)
    }
    if (!campsite) {
      campsite = await campsiteModel.findOne({ name: new RegExp(id, 'i') })
    }

    if (!campsite) {
      return res.json({ success: false, message: 'Campsite not found' })
    }

    res.json({ success: true, campsite })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
