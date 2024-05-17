import express from "express";
import {
    findUser,
    findUserByPhone,
    getUsers,
    getUsersByPhones,
    updateBio,
    updatePassword,
    updatePhoneNumber,
    updateProfile,
    uploadAvatar,
} from "../controllers/UserController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../utils/configMulter.js";
const router = express.Router();

router.patch("/:id/profile", verifyToken, updateProfile); // Update profile
router.patch("/:id/bio", verifyToken, updateBio); // Update bio
router.patch("/:id/phone", verifyToken, updatePhoneNumber); // Update phone number
router.patch("/:id/password", verifyToken, updatePassword); // Update password
router.patch("/:id/avatar", verifyToken, upload.single("image"), uploadAvatar); // Update avatar
router.post("/:id/findByPhones", verifyToken, getUsersByPhones); // Get list of users by phones
router.get("/find/phone", verifyToken, findUserByPhone);
router.get("/find/:userId", findUser);
router.get("/", verifyToken, getUsers);
export default router;
