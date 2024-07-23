import express from "express";
import {
    deleteMessage,
    getConversation,
    getConversations,
    getMessages,
    revokeMessage,
    sendFile,
    sendImage,
    sendMessage,
    sendVideo,
    shareMessage,
} from "../controllers/MessageController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../utils/configMulter.js";

const route = express.Router();

route.post("/send/:receiverId", verifyToken, sendMessage); // Gửi tin nhắn
route.post(
    "/send/image/:receiverId",
    verifyToken,
    upload.array("images[]", 10),
    sendImage
); // Gửi hình ảnh
route.post(
    "/send/file/:receiverId",
    verifyToken,
    upload.array("files[]", 10),
    sendFile
); // Gửi file
route.post(
    "/send/video/:receiverId",
    verifyToken,
    upload.array("videos[]", 10),
    sendVideo
); // Gửi file
route.post("/share/:receiverId", verifyToken, shareMessage); // Chuyển tiếp tin nhắn
route.get("/:userToChatId", verifyToken, getMessages); // Lấy tin nhắn
route.get("/conversation/:conversationId", verifyToken, getConversation); // Lấy 1 cuộc trò chuyện
route.get("/conversations/get", verifyToken, getConversations); // Lấy tất cả cuộc trò chuyện
route.post("/revoke/:participantId", verifyToken, revokeMessage); // Thu hồi tin nhắn
route.post("/delete", verifyToken, deleteMessage); // Xóa tin nhắn

export default route;
