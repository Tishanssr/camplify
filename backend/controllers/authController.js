import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";
import transporter from "../config/nodmailer.js";  

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: 'Missing Details' });
    }
    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit verification OTP during registration
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        const user = new userModel({
            name,
            email,
            password: hashedPassword,
            verifyOtp: otp,
            verifyOtpExpireAt: otpExpireAt,
            isAccountVerified: false,
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send OTP verification email
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Verify your Camplify Account',
            text: `Welcome to Camplify, ${name}!\n\nYour account verification OTP code is: ${otp}\n\nPlease enter this code to verify your account.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #277530;">Welcome to Camplify, ${name}!</h2>
                    <p>Thank you for signing up. Please use the verification code below to verify your email address:</p>
                    <div style="background: #e9f6e9; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #277530; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in 24 hours.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOption);
            console.log(`[AUTH] Verification OTP ${otp} successfully emailed to ${email}`);
        } catch (mailError) {
            console.error(`[AUTH] Failed to send email to ${email}:`, mailError.message);
        }

        return res.json({ success: true, message: 'Registration successful! Verification OTP sent to your email.' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and Password required' });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.json({ success: true, message: "Logged Out" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const sendVerifyotp = async (req, res) => {
    try {
        const userID = req.userID;
        const user = await userModel.findById(userID);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const mailoption = {
            from: process.env.SENDER_EMAIL || 'modecc99@gmail.com',
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this OTP.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #277530;">Camplify Account Verification</h2>
                    <p>Your verification code is:</p>
                    <div style="background: #e9f6e9; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #277530; margin: 20px 0;">
                        ${otp}
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailoption);
            console.log(`[AUTH] Resent OTP ${otp} to ${user.email}`);
        } catch (mailErr) {
            console.error(`[AUTH] Failed to resend email:`, mailErr.message);
        }

        return res.json({ success: true, message: 'Verification OTP sent to your email.' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const verifyemail = async (req, res) => {
    const userID = req.userID;
    const { otp } = req.body;

    if (!userID || !otp) {
        return res.json({ success: false, message: 'Missing Details' });
    }
    try {
        const user = await userModel.findById(userID);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        if (!user.verifyOtp || user.verifyOtp !== String(otp).trim()) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired' });
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: 'Email verified successfully' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Email is required' });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailoption = {
            from: process.env.SENDER_EMAIL || 'modecc99@gmail.com',
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #277530;">Password Reset Code</h2>
                    <p>Use the following OTP code to reset your password:</p>
                    <div style="background: #fff0e9; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #d4592a; margin: 20px 0;">
                        ${otp}
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailoption);
        return res.json({ success: true, message: 'OTP sent to your email' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: 'Email, OTP, and new password are required' });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (!user.resetOtp || user.resetOtp !== String(otp).trim()) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};