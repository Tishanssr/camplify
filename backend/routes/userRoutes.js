import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData, checkUserEmail, updateUserProfile } from '../controllers/userController.js';


const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);
userRouter.get('/check-email', userAuth, checkUserEmail);
userRouter.put('/profile', userAuth, updateUserProfile);

export default userRouter;