import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getReceiverSocketId, getUserSocketId, io } from "../utils/socket.js";
import User from "../models/User.js";
import { s3 } from "../utils/configAWS.js";

/* ---------- SEND MESSAGE SERVICE ---------- */
export const sendMessageService = async (
  user,
  receiverId,
  message,
  conversationName
) => {
  /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa
     Nếu chưa tạo 1 conversation mới và tin nhắn mới 
     Lưu tin nhắn vào conversation 
  */
  const senderId = user._id;
  let conversation = await Conversation.findOne({
    participants: {
      $all: [senderId, receiverId],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      name: conversationName,
      participants: [senderId, receiverId],
    });
  }

  const newMessage = new Message({
    senderId,
    receiverId,
    messageType: "text",
    message,
  });

  if (newMessage) {
    conversation.messages.push(newMessage._id);
  }

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

/* ---------- SEND IMAGE SERVICE ---------- */
export const sendImageService = async (
  user,
  receiverId,
  files,
  conversationName
) => {
  /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa
     Nếu chưa tạo 1 conversation mới và tin nhắn mới 
     Lưu tin nhắn vào conversation 
  */
  const senderId = user._id;
  let conversation = await Conversation.findOne({
    participants: {
      $all: [senderId, receiverId],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      name: conversationName,
      participants: [senderId, receiverId],
    });
  }

  /* Upload ảnh lên s3 */
  function uploadToS3(file) {
    const s3_params = {
      Bucket: process.env.S3_IMAGE_MESSAGE_BUCKET,
      Key: file.originalname + "1",
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    return s3.upload(s3_params).promise();
  }
  const promiseUpload = [];
  files.forEach((file) => {
    promiseUpload.push(uploadToS3(file));
  });
  const resultUpload = await Promise.all(promiseUpload).catch(() => {
    return {
      status: 500,
      msg: "Failed to send images",
    };
  });

  /* Tạo và lưu messages */
  function saveMessage(result) {
    const newMessage = new Message({
      senderId,
      receiverId,
      messageType: "image",
      message: result.Location,
    });
    return newMessage.save();
  }
  const promiseMessage = [];
  resultUpload.forEach((result) => {
    promiseMessage.push(saveMessage(result));
  });
  const resultMessage = await Promise.all(promiseMessage).catch(() => {
    return {
      status: 500,
      msg: "Failed to save message",
    };
  });

  /* Đẩy messages ID vào conversation */
  if (resultMessage) {
    resultMessage.forEach((result) => {
      conversation.messages.push(result._id);
    });
  }
  await conversation.save();

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newImages", resultMessage);
  }

  return {
    status: 200,
    msg: { resultMessage },
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
