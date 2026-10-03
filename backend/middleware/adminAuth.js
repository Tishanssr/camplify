import userModel from '../model/userModel.js'

const adminAuth = async (req, res, next) => {
  try {
    const userID = req.userID
    if (!userID) {
      return res.status(401).json({ success: false, message: 'Not Authorized. Please login again.' })
    }

    const user = await userModel.findById(userID)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export default adminAuth
