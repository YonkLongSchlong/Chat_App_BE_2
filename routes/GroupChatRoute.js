import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
const route = express.Router();
import { upload } from "../utils/configMulter.js";
import {
  addToGroupChat,
  closeGroupChat,
  createGroupChat,
  deleteGroupChatMessage,
  getGroupChatMessages,
  getParticipantsFromGroup,
  removeFromGroupChat,
  sendGroupChatFiles,
  sendGroupChatImages,
  sendGroupChatMessage,
  shareGroupChatMessage,
} from "../controllers/GroupChatController.js";

route.post("/create", verifyToken, createGroupChat); // Taọ group chat
route.get("/messages/get/:conversationId", verifyToken, getGroupChatMessages); // Lấy tin nhắn
route.post("/messages/send", verifyToken, sendGroupChatMessage); // Gửi tin nhắn
route.post("/messages/delete", verifyToken, deleteGroupChatMessage); // Xóa tin nhắn
route.post(
  "/messages/send/images",
  verifyToken,
  upload.array("images[]"),
  sendGroupChatImages
); // Gửi hình ảnh
route.post(
  "/messages/send/files",
  verifyToken,
  upload.array("files[]"),
  sendGroupChatFiles
); // Gửi file
route.post("/messages/share", verifyToken, shareGroupChatMessage); // Chuyển tiếp tin nhắn
route.post("/add", verifyToken, addToGroupChat); // Thêm participants vào group chat
route.post("/delete", verifyToken, removeFromGroupChat); // Thêm participants vào group chat
route.post("/close", verifyToken, closeGroupChat); // Giải tán group
route.get("/get/:conversationId", verifyToken, getParticipantsFromGroup); // Lấy danh sách participants trong group

export default route;
