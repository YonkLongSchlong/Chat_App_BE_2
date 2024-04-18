import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getReceiverSocketId, getUserSocketId, io } from "../utils/socket.js";
import { s3 } from "../utils/configAWS.js";
import User from "../models/User.js";

/* ---------- SEND MESSAGE SERVICE ---------- */
export const sendMessageService = async (user, receiverId, message) => {
  /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa */
  const userId = user._id;
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, receiverId], $size: 2 },
  });

  /* Nếu chưa tạo 1 conversation, message mới 
     Lưu message id vào conversation */
  if (!conversation) {
    const result = await Promise.all([
      await Conversation.create({
        participants: [userId.toString(), receiverId],
      }),
      await Message.create({
        senderId: userId.toString(),
        receiverId,
        messageType: "text",
        message,
      }),
    ]);

    conversation = result[0];
    const newMessage = result[1];

    conversation.messages.push(newMessage._id);
    await conversation.save();

    const userSocketId = getUserSocketId(userId.toString());
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (userSocketId && receiverSocketId) {
      io.to(receiverSocketId)
        .to(userSocketId)
        .emit("newConversation", conversation);
    } else {
      io.to(userSocketId).emit("newConversation", conversation);
    }

    return {
      status: 200,
      msg: { conversation, newMessage },
    };
  }

  /* Nếu từng nhắn rồi thì tạo message mới
   Lưu message id vào conversation */
  if (conversation) {
    const newMessage = new Message({
      senderId: userId.toString(),
      receiverId,
      messageType: "text",
      message,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]).catch(
      (error) => {
        return { status: 500, msg: "Fail to send message" };
      }
    );

    const receiverSocketId = getReceiverSocketId(receiverId);
    const userSocketId = getUserSocketId(userId.toString());
    if (receiverSocketId && userSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(userSocketId).to(receiverSocketId).emit("notification");
    }
    io.to(userSocketId).emit("notification");

    return {
      status: 200,
      msg: { conversation, newMessage },
    };
  }
};

/* ---------- SEND IMAGE SERVICE ---------- */
export const sendImageService = async (user, receiverId, files) => {
  /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa */
  const userId = user._id.toString();
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, receiverId], $size: 2 },
  });

  /* Nếu chưa tạo conversation mới */
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, receiverId],
    });
  }

  /* Function upload ảnh lên s3 */
  function uploadToS3(file) {
    const image = file.originalname.split(".");
    const fileType = image[image.length - 1];
    const fileName = `${userId}_${Date.now().toString()}.${fileType}`;
    const s3_params = {
      Bucket: process.env.S3_IMAGE_MESSAGE_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    return s3.upload(s3_params).promise();
  }

  /* Function tạo và lưu messages mới */
  function saveMessage(result, index) {
    const newMessage = new Message({
      senderId: userId,
      receiverId,
      messageType: "image",
      messageUrl: result.Location,
      message: files[index].originalname,
    });
    return newMessage.save();
  }

  /* Đẩy các promise upaload ảnh lên s3 vào trong mảng promiseUpload để promise all */
  const promiseUpload = [];
  files.forEach((file) => {
    promiseUpload.push(uploadToS3(file));
  });
  const resultUpload = await Promise.all(promiseUpload).catch((error) => {
    throw new Error(error.message);
  });

  /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
  const promiseMessage = [];
  resultUpload.forEach((result, index) => {
    promiseMessage.push(saveMessage(result, index));
  });
  const resultMessage = await Promise.all(promiseMessage).catch((error) => {
    throw new Error(error.message);
  });

  /* Lưu messages id vào conversation */
  if (resultMessage) {
    resultMessage.forEach((result) => {
      conversation.messages.push(result._id);
    });
    await conversation.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", resultMessage);
    }

    return {
      status: 200,
      msg: { resultMessage },
    };
  }
};

/* ---------- SEND FILE SERVICE ---------- */
export const sendFileService = async (user, receiverId, files) => {
  /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa */
  const userId = user._id.toString();
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, receiverId], $size: 2 },
  });

  /* Nếu chưa tạo conversation mới */
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, receiverId],
    });
  }

  /* Function upload file lên s3 */
  function uploadToS3(file) {
    const fileSend = file.originalname.split(".");
    const fileType = fileSend[fileSend.length - 1];
    const fileName = `${userId}_${
      file.originalname
    }_${Date.now().toString()}.${fileType}`;
    const s3_params = {
      Bucket: process.env.S3_FILE_MESSAGE_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    return s3.upload(s3_params).promise();
  }

  /* Function tạo và lưu messages mới */
  function saveMessage(result, index) {
    const newMessage = new Message({
      senderId: userId,
      receiverId,
      messageType: "file",
      messageUrl: result.Location,
      message: files[index].originalname,
    });
    return newMessage.save();
  }

  /* Đẩy các promise upaload ảnh lên s3 vào trong mảng promiseUpload để promise all */
  const promiseUpload = [];
  files.forEach((file) => {
    promiseUpload.push(uploadToS3(file));
  });
  const resultUpload = await Promise.all(promiseUpload).catch((error) => {
    throw new Error(error.message);
  });

  /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
  const promiseMessage = [];
  resultUpload.forEach((result, index) => {
    promiseMessage.push(saveMessage(result, index));
  });
  const resultMessage = await Promise.all(promiseMessage).catch((error) => {
    throw new Error(error.message);
  });

  /* Lưu messages id vào conversation */
  resultMessage.forEach((result) => {
    conversation.messages.push(result._id);
  });
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

/* ---------- SHARE MESSAGE SERVICE ---------- */
export const shareMessageService = async (user, receiverId, messageId) => {
  const userId = user._id.toString();

  if (receiverId === userId) {
    return {
      status: 400,
      msg: "You can't share message with yourself",
    };
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return {
      status: 404,
      msg: "Message not found",
    };
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, receiverId], $size: 2 },
  });

  if (!conversation) {
    let result = [];
    if (message.messageType == "text") {
      result = await Promise.all([
        await Conversation.create({
          participants: [userId, receiverId],
        }),
        await Message.create({
          senderId: userId,
          receiverId,
          messageType: "text",
          message: message.message,
        }),
      ]);
    } else if (message.messageType == "image") {
      result = await Promise.all([
        await Conversation.create({
          participants: [userId, receiverId],
        }),
        await Message.create({
          senderId: userId,
          receiverId,
          messageType: "image",
          message: message.message,
          messageUrl: message.messageUrl,
        }),
      ]);
    } else {
      result = await Promise.all([
        await Conversation.create({
          participants: [userId, receiverId],
        }),
        await Message.create({
          senderId: userId,
          receiverId,
          messageType: "file",
          message: message.message,
          messageUrl: message.messageUrl,
        }),
      ]);
    }

    conversation = result[0];
    const newMessage = result[1];

    conversation.messages.push(newMessage._id);
    await conversation.save();

    const userSocketId = getUserSocketId(userId);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (userSocketId && receiverSocketId) {
      io.to(receiverSocketId)
        .to(userSocketId)
        .emit("newConversation", conversation);
    } else {
      io.to(userSocketId).emit("newConversation", conversation);
    }

    return {
      status: 200,
      msg: { conversation, newMessage },
    };
  }

  if (conversation) {
    let newMessage = {};
    if (message.messageType == "text") {
      newMessage = await Message.create({
        senderId: userId,
        receiverId,
        messageType: "text",
        message: message.message,
      });
    } else if (message.messageType == "image") {
      newMessage = await Message.create({
        senderId: userId,
        receiverId,
        messageType: "image",
        message: message.message,
        messageUrl: message.messageUrl,
      });
    } else {
      newMessage = await Message.create({
        senderId: userId,
        receiverId,
        messageType: "file",
        message: message.message,
        messageUrl: message.messageUrl,
      });
    }

    conversation.messages.push(newMessage._id);
    await conversation.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    const userSocketId = getUserSocketId(userId.toString());
    if (receiverSocketId && userSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(userSocketId).to(receiverSocketId).emit("notification");
    }
    io.to(userSocketId).emit("notification");

    return {
      status: 200,
      msg: { conversation, newMessage },
    };
  }
};

/* ---------- DELETE MESSAGE SERVICE (THU HỒI) ---------- */
export const deleteMessageService = async (
  user,
  id,
  participantId,
  messageId
) => {
  if (user._id.toString() !== id) {
    return {
      status: 401,
      msg: "User not verified",
    };
  }

  /* Tìm message theo id, conversation của user và người nhận */
  const resultFind = await Promise.all([
    await Message.findById(messageId),
    await Conversation.findOne({
      participants: { $all: [id, participantId], $size: 2 },
    }),
  ]);
  if (!resultFind) {
    return {
      status: 404,
      msg: "Message or Conversation not found",
    };
  }

  const message = resultFind[0];
  const conversation = resultFind[1];

  /* Chỉ cho chép thu hồi tin nhắn của bản thân */
  if (message.senderId.toString() !== id) {
    return {
      status: 400,
      msg: "You dont't have permission to delete this message",
    };
  }

  /* Xóa message và message id trong conversation */
  const resultDelete = await Promise.all([
    await Message.findByIdAndDelete(messageId),
    await conversation.updateOne({
      $pull: {
        messages: messageId,
      },
    }),
  ]);
  if (!resultDelete) {
    return {
      status: 500,
      msg: "Deleting message failed",
    };
  }

  const messageDocs = resultDelete[0];

  /* Xóa conversation nếu không còn message nào trong conversation */
  if (conversation.messages.length == 1) {
    if (messageDocs) {
      const conversationDocs = await Conversation.findByIdAndDelete(
        conversation._id.toString()
      );
      const receiverSocketId = getReceiverSocketId(
        messageDocs.receiverId.toString()
      );
      const userSocketId = getUserSocketId(id);
      io.to(receiverSocketId).emit("delMessage", messageDocs);
      io.to(receiverSocketId)
        .to(userSocketId)
        .emit("delConversation", conversationDocs);

      return {
        status: 200,
        msg: messageDocs,
      };
    }
  }

  const receiverSocketId = getReceiverSocketId(
    messageDocs.receiverId.toString()
  );
  io.to(receiverSocketId).emit("delMessage", messageDocs);
  io.to(receiverSocketId).emit("notification");

  return {
    status: 200,
    msg: messageDocs,
  };
};

/* ---------- GET MESSAGES SERVICE ---------- */
export const getMessageService = async (user, userToChatId) => {
  const userId = user._id;

  /* Tìm conversation và messages của 2 người */
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, userToChatId], $size: 2 },
  }).populate("messages");

  /* Nếu không tìm thấy cuộc trò chuyện trả về mảng rỗng */
  if (!conversation) {
    return {
      status: 200,
      msg: [],
    };
  }

  /* Nếu tìm thấy trả về messages trong conversation */
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

  /* Tìm tất cả conversations mà user có */
  const conversations = await Conversation.find({
    participants: {
      $in: [user._id],
    },
  }).populate("participants messages");

  /* Nếu ko có conversations nào trả về mảng rỗng */
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

  /* Tìm conversation theo id */
  const conversations = await Conversation.findById(conversationId).populate(
    "participants messages"
  );

  /* Nếu ko tìm thấy trả về 404 */
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
