import express from "express";
import {
  login,
  logout,
  register,
  verifyRegister,
} from "../controllers/AuthController.js";

const router = express.Router();
router.post("/register", register);
router.post("/verifyRegister", verifyRegister);
router.post("/login", login);
router.get("/logout/:id", logout);

export default router;
