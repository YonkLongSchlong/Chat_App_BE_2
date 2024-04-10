import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

/* ---------- FRIEND REQUEST ---------- */
export const friendRequestService = async (user, id, recipentId) => {
  /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
  if (id !== user._id.toString()) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  if (id === recipentId) {
    return {
      status: 400,
      msg: "You can't send a friend request to yourself",
    };
  }

  /* Nếu user nhận lời mời không tồn tại trả về 404 */
  const receipent = await User.findById({ _id: recipentId });
  if (!receipent) {
    return {
      status: 404,
      msg: "Receipent not found",
    };
  }

  const checkFriendShip = await FriendRequest.findOne({
    requester: user._id.toString(),
    recipent: recipentId,
  });

  /* Nếu user đã gửi lời mời */
  if (checkFriendShip && checkFriendShip.status == 1) {
    return {
      status: 400,
      msg: "Request was already sent",
    };
  }

  /* Nếu user đã kết bạn */
  if (checkFriendShip && checkFriendShip.status == 2) {
    return {
      status: 400,
      msg: "You 2 have already been friends",
    };
  }

  /* Nếu user chưa gửi lời mời tiến hành tạo friend request trả về 201 */
  const friendShip = await FriendRequest.create({
    requester: user._id.toString(),
    recipent: recipentId,
    status: 1,
  });
  return {
    status: 201,
    msg: friendShip,
  };
};

/* ---------- FRIEND REQUEST ---------- */
export const cancelFriendRequestService = async (user, id, recipentId) => {
  /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
  if (id !== user._id.toString()) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  if (id === recipentId) {
    return {
      status: 400,
      msg: "You can't cancel a friend request or send it to yourself",
    };
  }

  const friendRequest = await FriendRequest.findOne({
    recipent: recipentId,
    requester: id,
  });
  if (!friendRequest) {
    return {
      status: 404,
      msg: "Friend request not found",
    };
  }
  if (friendRequest.status === 2) {
    return {
      status: 400,
      msg: "You 2 have already been friend",
    };
  }
  console.log(friendRequest._id.toString());

  const docs = await FriendRequest.findByIdAndDelete(
    friendRequest._id.toString()
  );

  if (docs) {
    return {
      status: 200,
      msg: "Friend request has been canceled",
    };
  }

  return {
    status: 500,
    msg: "Failed to cancel friend request",
  };
};

/* ---------- FRIEND ACCEPT ---------- */
export const friendAcceptService = async (user, id, requesterId) => {
  /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
  if (id !== user._id.toString()) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  /* Kiểm tra xem user đã kết bạn với người gửi lời mời hay chưa */
  const checkFriend = user.friends.includes(requesterId);
  if (checkFriend) {
    return {
      status: 203,
      msg: "You have already been friend",
    };
  }

  /* Query lấy thông tin user gửi lời mời và friend request dưới DB */
  const result = await Promise.all([
    FriendRequest.findOne({
      requester: requesterId,
      recipent: user._id,
    }),
    User.findOne({
      _id: requesterId,
    }),
  ]);

  /* Nếu result không trả về undefined tiến hành thực hiện:
    1. Đổi status của lời mời kết bạn thành 2 = đã kết bạn
    2. Push ID của người gửi và ID của người nhận vào list friend của 2 bên
    3. Lưu xuống dưới DB trả về 200
  */
  if (!result) {
    return {
      status: 404,
      msg: "Friend request or user not found",
    };
  }
  const friendRequest = result[0];
  const requester = result[1];

  friendRequest.status = 2;
  user.friends.push(requesterId);
  requester.friends.push(user._id);
  const response = await Promise.all([
    friendRequest.save(),
    user.save(),
    requester.save(),
  ]);
  return {
    status: 200,
    msg: response,
  };
};

/* ---------- GET ALL FRIEND REQUESTS ---------- */
export const getAllFriendsRequestService = async (user, id) => {
  /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
  if (id !== user._id.toString()) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  const response = await FriendRequest.aggregate([
    {
      $match: {
        status: 1,
        recipent: user._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "requester",
        foreignField: "_id",
        as: "req",
      },
    },
    { $unwind: "$req" },
    {
      $project: {
        "req.password": 0,
        requester: 0,
      },
    },
  ]);

  if (response.length <= 0) {
    return {
      status: 401,
      msg: "There no friend requests found",
    };
  }

  return {
    status: 200,
    msg: response,
  };
};

/* ---------- GET ALL FRIEND REQUESTS SENTED---------- */
export const getAllFriendsRequestSentedService = async (user, id) => {
  /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
  if (id !== user._id.toString()) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  const response = await FriendRequest.aggregate([
    {
      $match: {
        status: 1,
        requester: user._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "recipent",
        foreignField: "_id",
        as: "recei",
      },
    },
    { $unwind: "$recei" },
    {
      $project: {
        "recei.password": 0,
        recipent: 0,
      },
    },
  ]);

  if (response.length <= 0) {
    return {
      status: 404,
      msg: "There no friend requests found",
    };
  }

  return {
    status: 200,
    msg: response,
  };
};

/* ---------- GET FRIEND LIST SERVICE---------- */
export const getFriendsListService = async (user, id) => {
  if (id !== user._id.toString()) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  const userWithFriends = await User.findById(id).populate({
    path: "friends",
    options: {
      sort: { username: 1 },
    },
  });
  return {
    status: 200,
    msg: userWithFriends.friends,
  };
};
