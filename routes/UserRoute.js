import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getUsersByPhones,
  updateBio,
  updatePassword,
  updatePhoneNumber,
  updateProfile,
  findUser,
  getUsers,
  uploadAvatar,
} from "../controllers/UserController.js";
import { upload } from "../utils/configMulter.js";
const router = express.Router();

router.patch("/:id/profile", verifyToken, updateProfile); // Update profile
router.patch("/:id/bio", verifyToken, updateBio); // Update bio
router.patch("/:id/phone", verifyToken, updatePhoneNumber); // Update phone number
router.patch("/:id/password", verifyToken, updatePassword); // Update password
router.patch("/:id/avatar", verifyToken, upload.single("image"), uploadAvatar); // Update avatar
router.post("/:id/findByPhones", verifyToken, getUsersByPhones); // Get list of users by phones
router.get("/find/:userId", verifyToken, findUser);
router.get("/", verifyToken, getUsers);
export default router;
