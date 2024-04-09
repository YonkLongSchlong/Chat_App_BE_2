import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../controllers/MessageController.js";

const route = express.Router();

route.post("/send/:receiverId", verifyToken, sendMessage);
route.get("/:userToChatId", verifyToken, getMessages);
route.get("/conversations/:id", verifyToken, getConversations);

export default route;
