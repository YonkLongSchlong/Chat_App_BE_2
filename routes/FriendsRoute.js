import express from "express";
import {
  cancelFriendRequest,
  friendAccept,
  friendRequest,
  getAllFriendsRequest,
  getAllFriendsRequestSented,
  getFriendsList,
} from "../controllers/FriendController.js";
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();

router.get("/:id", verifyToken, getFriendsList); // Get all friends (sort by username)
router.post("/:id/:recipentId", verifyToken, friendRequest); // Send friend request
router.get("/:id/:recipentId/cancel", verifyToken, cancelFriendRequest); // Cancel friend request
router.get("/:id/:requesterId/accept", verifyToken, friendAccept); // Accept friend request
router.get("/:id/:requesterId/decline"); // Decline friend request
router.get("/:id/requests", verifyToken, getAllFriendsRequest); // Get all friend requests
router.get("/:id/requests/sented", verifyToken, getAllFriendsRequestSented); // Get all friend requests sented

export default router;
