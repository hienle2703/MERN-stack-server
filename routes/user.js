import express from "express";
import {
  getMyProfile,
  login,
  signup,
  logOut,
  updateProfile,
  changePassword,
  updatePic,
  forgetPassword,
  resetPassword,
  getAllUsers,
  deleteUser,
} from "../controllers/user.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.get("/me", isAuthenticated, getMyProfile);

router.post("/login", login);

router.post("/new", singleUpload, signup);

router.get("/logout", isAuthenticated, logOut);

// Update Routes
router.put("/updateprofile", isAuthenticated, updateProfile);
router.put("/changepassword", isAuthenticated, changePassword);
router.put("/updatepic", isAuthenticated, singleUpload, updatePic);

// Forget Password & Reset Password
router.route("/forgetpassword").post(forgetPassword).put(resetPassword);

// Get - Delete users
router.get("/get-all-users", isAuthenticated, isAdmin, getAllUsers);
router.route("/delete-user/:id").delete(isAuthenticated, isAdmin, deleteUser);

export default router;
