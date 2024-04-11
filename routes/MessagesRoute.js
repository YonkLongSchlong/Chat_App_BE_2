import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  deleteMessage,
  getConversation,
  getConversations,
  getMessages,
  sendImage,
  sendMessage,
} from "../controllers/MessageController.js";
import { upload } from "../utils/configMulter.js";

const route = express.Router();

route.post("/send/:receiverId", verifyToken, sendMessage);
route.post(
  "/send/image/:receiverId",
  verifyToken,
  upload.array("images[]"),
  sendImage
);
route.get("/:userToChatId", verifyToken, getMessages);
route.get("/conversations/:id", verifyToken, getConversations);
route.get("/conversation/:id/:conversationId", verifyToken, getConversation);
route.post("/delete/:id/:messageId", verifyToken, deleteMessage);

export default route;
