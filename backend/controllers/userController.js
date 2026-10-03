import userModel from '../model/userModel.js'
import tripModel from '../model/tripModel.js'
import { uploadToOracleStorage, deleteFromOracleStorage } from '../config/ociStorageService.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FIELD_LIMITS = {
  name: 80,
  bio: 500,
  phone: 20,
  homeTown: 100,
}

const buildPublicUserData = (user) => {
  const isPremium = Boolean(
    user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date()
  )
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    homeTown: user.homeTown || '',
    bio: user.bio || '',
    profilePicture: user.profilePicture || '',
    role: user.role || 'user',
    isPremium,
    premiumExpiresAt: user.premiumExpiresAt || null,
    premiumActivatedAt: user.premiumActivatedAt || null,
    isAccountVerified: user.isAccountVerified,
    privacySettings: user.privacySettings || {
      showPhone: false,
      showHomeTown: true,
      showBio: true,
      showEmail: false,
    },
  }
}

// ─── Get own user data ────────────────────────────────────────────────────────

export const getUserData = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.json({ success: true, userData: buildPublicUserData(user) })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Update own profile ───────────────────────────────────────────────────────

export const updateUserProfile = async (req, res) => {
  try {
    const userID = req.userID
    const { name, phone, homeTown, bio, privacySettings } = req.body

    // Field length validation
    const fields = { name, bio, phone, homeTown }
    for (const [field, value] of Object.entries(fields)) {
      if (value !== undefined && String(value).trim().length > FIELD_LIMITS[field]) {
        return res.status(400).json({
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be ${FIELD_LIMITS[field]} characters or fewer.`,
        })
      }
    }

    const user = await userModel.findById(userID)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (name !== undefined) user.name = String(name).trim()
    if (phone !== undefined) user.phone = String(phone).trim()
    if (homeTown !== undefined) user.homeTown = String(homeTown).trim()
    if (bio !== undefined) user.bio = String(bio).trim()

    if (privacySettings && typeof privacySettings === 'object') {
      const allowed = ['showPhone', 'showHomeTown', 'showBio', 'showEmail']
      for (const key of allowed) {
        if (typeof privacySettings[key] === 'boolean') {
          user.privacySettings[key] = privacySettings[key]
        }
      }
    }

    await user.save()

    res.json({
      success: true,
      message: 'Profile details updated successfully!',
      userData: buildPublicUserData(user),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Upload avatar ────────────────────────────────────────────────────────────

export const uploadAvatar = async (req, res) => {
  try {
    const userID = req.userID

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' })
    }

    const user = await userModel.findById(userID)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Delete old avatar from OCI if it exists
    if (user.profilePicture && user.profilePicture.startsWith('/api/images/avatars/')) {
      await deleteFromOracleStorage(user.profilePicture)
    }

    // Upload new avatar to OCI avatars/ folder — returns object key
    const objectKey = await uploadToOracleStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'avatars'
    )

    const filename = objectKey.split('/').pop()
    const proxyUrl = `/api/images/avatars/${filename}`

    user.profilePicture = proxyUrl
    await user.save()

    res.json({ success: true, profilePicture: proxyUrl, message: 'Avatar uploaded successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Get public profile of another user (trip members only) ──────────────────

export const getPublicProfile = async (req, res) => {
  try {
    const viewerID = req.userID
    const { userId } = req.params

    if (String(viewerID) === String(userId)) {
      // Viewing own profile — return full data
      const user = await userModel.findById(userId)
      if (!user) return res.status(404).json({ success: false, message: 'User not found' })
      return res.json({ success: true, profile: buildPublicUserData(user), isSelf: true })
    }

    const target = await userModel.findById(userId)
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Verify the viewer shares a confirmed/accepted trip with the target user
    const sharedTrip = await tripModel.findOne({
      participants: {
        $all: [
          { $elemMatch: { user: viewerID, status: { $in: ['confirmed', 'accepted'] } } },
          { $elemMatch: { user: userId,   status: { $in: ['confirmed', 'accepted'] } } },
        ],
      },
    })

    // Also check if either is the organizer of a trip the other confirmed
    const sharedAsOrganizer = await tripModel.findOne({
      $or: [
        {
          organizer: viewerID,
          participants: { $elemMatch: { user: userId, status: { $in: ['confirmed', 'accepted'] } } },
        },
        {
          organizer: userId,
          participants: { $elemMatch: { user: viewerID, status: { $in: ['confirmed', 'accepted'] } } },
        },
      ],
    })

    if (!sharedTrip && !sharedAsOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must share a confirmed trip with this user to view their profile.',
      })
    }

    // Build privacy-filtered profile
    const privacy = target.privacySettings || {}
    const profile = {
      _id: target._id,
      name: target.name,
      profilePicture: target.profilePicture || '',
      hiddenFields: [],
    }

    if (privacy.showBio !== false && target.bio) {
      profile.bio = target.bio
    } else if (target.bio) {
      profile.hiddenFields.push('bio')
    }

    if (privacy.showHomeTown !== false && target.homeTown) {
      profile.homeTown = target.homeTown
    } else if (target.homeTown) {
      profile.hiddenFields.push('homeTown')
    }

    if (privacy.showPhone === true && target.phone) {
      profile.phone = target.phone
    }

    if (privacy.showEmail === true) {
      profile.email = target.email
    }

    res.json({ success: true, profile })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Check user by email (invitation flow) ────────────────────────────────────

export const checkUserEmail = async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' })
    }
    const cleanEmail = String(email).toLowerCase().trim()
    const user = await userModel.findOne({ email: cleanEmail })
    if (!user) {
      return res.json({
        success: false,
        exists: false,
        message: `No registered user found with email address "${cleanEmail}". Please ask them to register first.`,
      })
    }
    res.json({
      success: true,
      exists: true,
      user: { name: user.name, email: user.email, id: user._id },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Admin set user premium status (testing / manual override) ────────────────
export const setPremiumStatus = async (req, res) => {
  try {
    const { userId, isPremium, durationDays = 365 } = req.body
    const user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (isPremium) {
      user.isPremium = true;
      user.premiumActivatedAt = new Date()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number(durationDays))
      user.premiumExpiresAt = expiresAt
    } else {
      user.isPremium = false
      user.premiumExpiresAt = null
    }

    await user.save()
    res.json({
      success: true,
      message: `User premium status set to ${isPremium}`,
      userData: buildPublicUserData(user),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}