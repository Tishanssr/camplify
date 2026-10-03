import express from 'express';
import { isAuthenticated, login, logout, register, sendResetOtp, sendVerifyotp, verifyemail,resetPassword } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';
import { loginLimiter, otpSendLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js';

const authRouter = express.Router();

authRouter.post('/register',register);
authRouter.post('/login', loginLimiter, login);
authRouter.post('/logout',logout);
authRouter.post('/send-verify-otp', otpSendLimiter, userAuth, sendVerifyotp);
authRouter.post('/verify-account', otpVerifyLimiter, userAuth, verifyemail);
authRouter.post('/is-auth',userAuth,isAuthenticated);
authRouter.post('/send-reset-otp', otpSendLimiter, sendResetOtp);
authRouter.post('/reset-password', otpVerifyLimiter, resetPassword);
export default authRouter;
