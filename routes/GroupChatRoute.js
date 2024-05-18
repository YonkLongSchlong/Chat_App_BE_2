import express from "express";
import {
    addAminPermission,
    addToGroupChat,
    closeGroupChat,
    createGroupChat,
    deleteGroupChatMessage,
    getGroupChatMessages,
    getParticipantsFromGroup,
    leaveGroupChat,
    removeFromGroupChat,
    revokeAdminPermission,
    sendGroupChatFiles,
    sendGroupChatImages,
    sendGroupChatMessage,
    sendGroupChatVideos,
    shareGroupChatMessage,
} from "../controllers/GroupChatController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../utils/configMulter.js";
const route = express.Router();

route.post("/create", verifyToken, createGroupChat); // Taọ group chat
route.get("/messages/get/:conversationId", verifyToken, getGroupChatMessages); // Lấy tin nhắn
route.post("/messages/send", verifyToken, sendGroupChatMessage); // Gửi tin nhắn
route.post("/messages/revoke", verifyToken, deleteGroupChatMessage); // Thu hồi tin nhắn
route.post(
    "/messages/send/images",
    verifyToken,
    upload.array("images[]"),
    sendGroupChatImages
); // Gửi hình ảnh
route.post(
    "/messages/send/files/:conversationId",
    verifyToken,
    upload.array("files[]"),
    sendGroupChatFiles
); // Gửi file
route.post(
    "/messages/send/videos",
    verifyToken,
    upload.array("videos[]"),
    sendGroupChatVideos
); // Gửi videos
route.post("/messages/share", verifyToken, shareGroupChatMessage); // Chuyển tiếp tin nhắn
route.post("/add", verifyToken, addToGroupChat); // Thêm participants vào group chat
route.post("/admin/grant", verifyToken, addAminPermission); // Ban quyền admin cho user
route.post("/admin/revoke", verifyToken, revokeAdminPermission); // Xóa quyền admin cho user
route.post("/delete", verifyToken, removeFromGroupChat); // Xóa participants vào group chat
route.post("/leave", verifyToken, leaveGroupChat); // Xóa participants vào group chat
route.post("/close", verifyToken, closeGroupChat); // Giải tán group
route.get("/get/:conversationId", verifyToken, getParticipantsFromGroup); // Lấy danh sách participants trong group

export default route;
