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
    const newMessage = await Message.create({
      senderId,
      receiverId,
      messageType: "text",
      message,
    });
    conversation.messages.push(newMessage._id);
    await conversation.save();
    const userSocketId = getUserSocketId(senderId);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (userSocketId) {
      io.to(userSocketId).emit("newConversation", conversation);
      io.to(receiverSocketId).emit("newConversation", conversation);
    }

    return {
      status: 200,
      msg: { conversation, newMessage },
    };
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
    const image = file.originalname.split(".");
    console.log(image);
    const fileType = image[image.length - 1];
    const fileName = `${senderId}_${Date.now().toString()}.${fileType}`;
    const s3_params = {
      Bucket: process.env.S3_IMAGE_MESSAGE_BUCKET,
      Key: fileName,
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
    io.to(receiverSocketId).emit("newMessage", resultMessage);
  }

  return {
    status: 200,
    msg: { resultMessage },
  };
};

/* ---------- DELETE MESSAGE SERVICE ---------- */
export const deleteMessageService = async (user, id, messageId) => {
  if (user._id.toString() !== id) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return {
      status: 404,
      msg: "Message not found",
    };
  }

  if (message.senderId.toString() !== id) {
    return {
      status: 400,
      msg: "You dont't have permission to delete this message",
    };
  }

  const docs = await Message.findByIdAndDelete(messageId);

  if (docs) {
    const receiverSocketId = getReceiverSocketId(docs.receiverId.toString());
    io.to(receiverSocketId).emit("delMessage", docs);

    return {
      status: 200,
      msg: docs,
    };
  }

  return {
    status: 500,
    msg: "Deleted message Failed",
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

/* ---------- GET CONVERSATION SERVICE ---------- */
export const getConversationService = async (user, id, conversationId) => {
  if (user._id.toString() !== id) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  const conversations = await Conversation.findById(conversationId).populate(
    "participants messages"
  );

  if (!conversations) {
    return {
      status: 404,
      msg: "Conversation not found",
    };
  }

  return {
    status: 200,
    msg: conversations,
  };
};
