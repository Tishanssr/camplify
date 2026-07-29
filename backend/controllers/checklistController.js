import personalChecklistModel from '../model/personalChecklistModel.js'
import groupChecklistModel from '../model/groupChecklistModel.js'

// Get Personal Checklist for current user
export const getPersonalChecklist = async (req, res) => {
  try {
    const userID = req.userID
    let checklist = await personalChecklistModel.findOne({ user: userID })

    if (!checklist) {
      checklist = new personalChecklistModel({
        user: userID,
        items: [
          { name: 'Sleeping bag', done: false },
          { name: 'Headlamp + spare batteries', done: false },
          { name: 'Water bottle', done: false },
          { name: 'Rain jacket', done: false },
          { name: 'Personal medicine', done: false },
        ],
      })
      await checklist.save()
    }

    res.json({ success: true, items: checklist.items })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Add Personal Item
export const addPersonalItem = async (req, res) => {
  try {
    const userID = req.userID
    const { name } = req.body

    let checklist = await personalChecklistModel.findOne({ user: userID })
    if (!checklist) {
      checklist = new personalChecklistModel({ user: userID, items: [] })
    }

    checklist.items.push({ name, done: false })
    await checklist.save()

    res.json({ success: true, items: checklist.items })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Toggle Personal Item
export const togglePersonalItem = async (req, res) => {
  try {
    const userID = req.userID
    const { itemId } = req.params
    const { completed } = req.body

    const checklist = await personalChecklistModel.findOne({ user: userID })
    if (checklist) {
      const item = checklist.items.id(itemId)
      if (item) {
        item.done = completed !== undefined ? completed : !item.done
        await checklist.save()
      }
    }

    res.json({ success: true, message: 'Item updated' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Delete Personal Item
export const deletePersonalItem = async (req, res) => {
  try {
    const userID = req.userID
    const { itemId } = req.params

    const checklist = await personalChecklistModel.findOne({ user: userID })
    if (checklist) {
      checklist.items = checklist.items.filter((item) => String(item._id) !== itemId)
      await checklist.save()
    }

    res.json({ success: true, message: 'Item deleted' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get Group Equipment Checklist for a Trip
export const getGroupChecklist = async (req, res) => {
  try {
    const { tripId } = req.params
    const groups = await groupChecklistModel.find({ trip: tripId })
    res.json({ success: true, groups })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
