import {
  friendAcceptService,
  friendRequestService,
  getAllFriendsRequestService,
  getFriendsListService,
} from "../services/FriendService.js";

/* ---------- FRIEND REQUEST ---------- */
export const friendRequest = async (req, res) => {
  try {
    const { id, recipentId } = req.params;
    const user = req.user;

    const response = await friendRequestService(user, id, recipentId);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Something went wrong in friend request feature",
      msg: error.message,
    });
  }
};

/* ---------- FRIEND ACCEPT ---------- */
export const friendAccept = async (req, res) => {
  try {
    const { id, requesterId } = req.params;
    const user = req.user;

    const response = await friendAcceptService(user, id, requesterId);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Something went wrong in friend accept feature",
      msg: error,
    });
  }
};

/* ---------- GET ALL FRIENDS REQUEST ---------- */
export const getAllFriendsRequest = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const response = await getAllFriendsRequestService(user, id);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Something went wrong in get friend requests",
      msg: error.message,
    });
  }
};

/* ---------- GET FRIEND LIST ---------- */
export const getFriendsList = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const response = await getFriendsListService(user, id);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({ Error: "Error in getting friends list" });
  }
};
