import {Router} from "express"

import {
  getProfile,
  login,
  logout,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser
} from "../controllers/user.controllers.js";

import { isLoggedIn } from "../middlewares/auth.middleware.js";

import upload from "../middlewares/multer.middleware.js"

const router=Router();

router.post('/register',upload.single("avatar") , register);

router.post('/login',login);

router.post('/logout',logout);

router.get('/me',isLoggedIn,getProfile);

router.post('/reset',forgotPassword);

router.post('/reset/:resetToken',resetPassword);

router.post('/change-password',isLoggedIn, changePassword);

router.put('/update/:id',isLoggedIn,upload.single("avatar"),updateUser);

export default router;