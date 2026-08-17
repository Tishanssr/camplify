import userModel from "../model/userModel.js";

export const getUserData = async(req,res)=>{
try {
    const userID = req.userID;
    const user = await userModel.findById(userID);
    if(!user){
        return res.json({success:false,message:'User not found'})
    }
    res.json({
        success:true,
        userData: {
            _id: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            homeTown: user.homeTown || '',
            bio: user.bio || '',
            preferences: user.preferences || [],
            isAccountVerified: user.isAccountVerified
        }
    });
} catch (error) {
    res.json({success:false,message:error.message})
}
}

export const updateUserProfile = async (req, res) => {
  try {
    const userID = req.userID;
    const { name, phone, homeTown, bio, preferences } = req.body;

    const user = await userModel.findById(userID);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (homeTown !== undefined) user.homeTown = String(homeTown).trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (Array.isArray(preferences)) user.preferences = preferences;

    await user.save();

    res.json({
      success: true,
      message: 'Profile details updated successfully!',
      userData: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        homeTown: user.homeTown,
        bio: user.bio,
        preferences: user.preferences,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export const checkUserEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.json({ success: false, message: 'Email address is required' });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const user = await userModel.findOne({ email: cleanEmail });
    if (!user) {
      return res.json({
        success: false,
        exists: false,
        message: `No registered user found with email address "${cleanEmail}". Please ask them to register first.`,
      });
    }
    res.json({
      success: true,
      exists: true,
      user: { name: user.name, email: user.email, id: user._id },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};