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
            isAccountVerified: user.isAccountVerified
        }
    });
} catch (error) {
    res.json({success:false,message:error.message})
}
}