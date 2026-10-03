import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type:String, required:true},
    email: {type:String, required:true,unique:true},
    password: {type:String, required:true},
    phone: {type:String, default:''},
    homeTown: {type:String, default:''},
    bio: {type:String, default:''},
    profilePicture: {type:String, default:''},
    privacySettings: {
        showPhone:    {type:Boolean, default:false},
        showHomeTown: {type:Boolean, default:true},
        showBio:      {type:Boolean, default:true},
        showEmail:    {type:Boolean, default:false},
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
    premiumActivatedAt: { type: Date, default: null },
    payhereSubscriptionId: { type: String, default: '' },
    verifyOtp:{type:String, default:''},
    verifyOtpExpireAt:{type:Number, default:0},
    isAccountVerified:{type:Boolean,default:false},
    resetOtp:{type:String, default:''},
    resetOtpExpireAt:{type:Number,default:0}
})


const userModel = mongoose.models.user || mongoose.model('user',userSchema);

export default userModel;