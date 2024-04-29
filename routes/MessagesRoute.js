import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    deleteMessage,
    getConversation,
    getConversations,
    getMessages,
    sendFile,
    sendImage,
    sendMessage,
    shareMessage,
} from "../controllers/MessageController.js";
import { upload } from "../utils/configMulter.js";

const route = express.Router();

route.post("/send/:receiverId", verifyToken, sendMessage); // Gửi tin nhắn
route.post(
    "/send/image/:receiverId",
    verifyToken,
    upload.array("images[]"),
    sendImage
); // Gửi hình ảnh
route.post(
    "/send/file/:receiverId",
    verifyToken,
    upload.array("files[]", 10),
    sendFile
); // Gửi file
route.post("/share/:receiverId", verifyToken, shareMessage); // Chuyển tiếp tin nhắn
route.get("/:userToChatId", verifyToken, getMessages); // Lấy tin nhắn
route.get("/conversation/:conversationId", verifyToken, getConversation); // Lấy 1 cuộc trò chuyện
route.get("/conversations/get", verifyToken, getConversations); // Lấy tất cả cuộc trò chuyện
route.post("/revoke/:participantId", verifyToken, deleteMessage); // Thu hồi tin nhắn

export default route;
