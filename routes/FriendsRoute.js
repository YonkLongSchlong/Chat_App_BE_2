import express from "express";
import {
  friendAccept,
  friendRequest,
  getAllFriendsRequest,
  getFriendsList,
} from "../controllers/FriendController.js";
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();

router.get("/:id", verifyToken, getFriendsList); // Get all friends
router.post("/:id/:recipentId", verifyToken, friendRequest); // Send friend request
router.get("/:id/:requesterId/accept", verifyToken, friendAccept); // Accept friend request
router.get("/:id/requests", verifyToken, getAllFriendsRequest); // Get all friend requests

export default router;
