import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
const route = express.Router();
import { upload } from "../utils/configMulter.js";
import {
  createGroupChat,
  deleteGroupChatMessage,
  getGroupChatMessages,
  sendGroupChatFiles,
  sendGroupChatImages,
  sendGroupChatMessage,
} from "../controllers/GroupChatController.js";

route.post("/create", verifyToken, createGroupChat);
route.get("/messages/get/:conversationId", verifyToken, getGroupChatMessages);
route.post("/messages/send", verifyToken, sendGroupChatMessage);
route.post("/messages/delete", verifyToken, deleteGroupChatMessage);
route.post(
  "/messages/send/images",
  verifyToken,
  upload.array("images[]"),
  sendGroupChatImages
);
route.post(
  "/messages/send/files",
  verifyToken,
  upload.array("files[]"),
  sendGroupChatFiles
);

export default route;
