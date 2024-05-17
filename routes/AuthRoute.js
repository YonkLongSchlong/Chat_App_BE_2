import express from "express";
import {
    findUserByToken,
    login,
    logout,
    register,
    verifyRegister,
} from "../controllers/AuthController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
router.post("/register", register);
router.post("/verifyRegister", verifyRegister);
router.post("/login", login);
router.get("/logout/:id", logout);
router.get("/find", verifyToken, findUserByToken);

export default router;
