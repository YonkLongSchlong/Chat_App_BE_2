import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getReceiverSocketId, io } from "../utils/socket.js";
import User from "../models/User.js";

/* ---------- SEND MESSAGE SERVICE ---------- */
export const sendMessageService = async (user, receiverId, message) => {
  /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa
     Nếu chưa tạo 1 conversation mới và tin nhắn mới 
     Lưu tin nhắn vào conversation 
  */
  const senderId = user._id;

  const conversation = await Conversation.findOne({
    participants: {
      $all: [senderId, receiverId],
    },
  });

  if (!conversation) {
    const receiver = await User.findById(receiverId);
    const result = await Promise.all([
      Conversation.create({
        name: receiver.username,
        participants: [senderId, receiverId],
      }),
      Message.create({
        senderId,
        receiverId,
        message,
      }),
    ]).catch((error) => {
      return {
        status: 500,
        msg: "Failed to create conversation",
      };
    });

    const conversation = result[0];
    const newMessage = result[1];

    conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);
    return {
      status: 200,
      msg: { newMessage, conversation },
    };
  }

  /* Nếu conversation đã tồn tại thì tạo 1 tin nhắn mới
     Lưu tin nhắn vào conversation
  */
  const newMessage = new Message({
    senderId,
    receiverId,
    message,
  });
  conversation.messages.push(newMessage);
  await Promise.all([conversation.save(), newMessage.save()]).catch((error) => {
    return { status: 500, msg: "Fail to send message" };
  });

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }

  return {
    status: 200,
    msg: { conversation, newMessage },
  };
};

/* ---------- GET MESSAGE SERVICE ---------- */
export const getMessageService = async (user, userToChatId) => {
  const userId = user._id;

  /* Tìm cuộc trò chuyện và tin nhắn của 2 người */
  const conversation = await Conversation.findOne({
    participants: {
      $all: [userId, userToChatId],
    },
  }).populate("messages");

  /* Nếu không tìm thấy cuộc trò chuyện trả về mảng rỗng */
  if (!conversation) {
    return {
      status: 200,
      msg: [],
    };
  }

  /* Nếu tìm thấy trả về cuộc trò chuyện và lấy tin nhắn ra trên FE */
  return {
    status: 200,
    msg: conversation.messages,
  };
};

/* ---------- GET CONVERSATIONS SERVICE ---------- */
export const getConversationsService = async (user, id) => {
  if (user._id.toString() !== id) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  const conversations = await Conversation.find({
    participants: {
      $in: [user._id],
    },
  }).populate("participants messages");

  if (!conversations) {
    return {
      status: 200,
      msg: [],
    };
  }

  return {
    status: 200,
    msg: conversations,
  };
};
