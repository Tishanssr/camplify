import jwt from 'jsonwebtoken'

const userAuth = async (req, res, next) => {
  let token = req.cookies?.token

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.json({ success: false, message: 'Not Authorized. Please login again.' })
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)
    if (tokenDecode.id) {
      req.userID = tokenDecode.id
      next()
    } else {
      return res.json({ success: false, message: 'Not Authorized. Please login again.' })
    }
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

export default userAuth