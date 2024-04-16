import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { s3 } from "../utils/configAWS.js";

/* ---------- CREATE GROUP CHAT SERVICE ---------- */
export const createGroupChatService = async (
  user,
  participantsId,
  conversationName
) => {
  const userId = user._id.toString();
  const conversation = await Conversation.create({
    participants: [userId, ...participantsId],
    name: conversationName,
  });

  return {
    status: 200,
    msg: conversation,
  };
};

/* ---------- GET MESSAGES FROM GROUP CHAT SERVICE ---------- */
export const getGroupChatMessagesService = async (user, conversationId) => {
  const userId = user._id.toString();
  const conversation = await Conversation.findById(conversationId).populate(
    "messages"
  );

  if (!conversation) {
    return {
      status: 404,
      msg: "Conversation not found",
    };
  }

  return {
    status: 200,
    msg: conversation.messages,
  };
};

/* ---------- SEND MESSAGE TO GROUP CHAT SERVICE ---------- */
export const sendGroupChatMessageService = async (
  user,
  conversationId,
  message
) => {
  const userId = user._id.toString();
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return {
      status: 404,
      msg: "Conversation not found",
    };
  }

  const newMessage = new Message({
    senderId: userId,
    receiverId: conversation._id.toString(),
    message: message,
    messageType: "text",
  });

  if (newMessage) {
    conversation.messages.push(newMessage);
    await Promise.all([conversation.save(), newMessage.save()]).catch(
      (error) => {
        throw new Error(error.message);
      }
    );

    return {
      status: 200,
      msg: newMessage,
    };
  }
};

/* ---------- SEND IMAGES TO GROUP CHAT SERVICE ---------- */
export const sendGroupChatImagesService = async (
  user,
  conversationId,
  files
) => {
  const userId = user._id.toString();
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return {
      status: 404,
      msg: "Conversation not found",
    };
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
      receiverId: conversationId,
      messageType: "image",
      messageUrl: result.Location,
      message: files[index].originalname,
    });
    return newMessage.save();
  }

  const promiseUpload = [];
  files.forEach((file) => {
    promiseUpload.push(uploadToS3(file));
  });
  const resultUpload = await Promise.all(promiseUpload).catch((error) => {
    throw new Error(error.message);
  });

  const promiseMessage = [];
  resultUpload.forEach((result, index) => {
    promiseMessage.push(saveMessage(result, index));
  });
  const resultMessage = await Promise.all(promiseMessage).catch(() => {
    throw new Error(error.message);
  });

  resultMessage.forEach((result) => {
    conversation.messages.push(result._id);
  });
  await conversation.save();

  return {
    status: 200,
    msg: { resultMessage },
  };
};

/* ---------- SEND FILES TO GROUP CHAT SERVICE ---------- */
export const sendGroupChatFilesService = async (
  user,
  conversationId,
  files
) => {
  const userId = user._id.toString();

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return {
      status: 404,
      msg: "Conversation not found",
    };
  }

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
  function saveMessage(result, index) {
    const newMessage = new Message({
      senderId: userId,
      receiverId: conversationId,
      messageType: "file",
      messageUrl: result.Location,
      message: files[index].originalname,
    });
    return newMessage.save();
  }

  const promiseUpload = [];
  files.forEach((file) => {
    promiseUpload.push(uploadToS3(file));
  });
  const resultUpload = await Promise.all(promiseUpload).catch((error) => {
    throw new Error(error.message);
  });

  const promiseMessage = [];
  resultUpload.forEach((result, index) => {
    promiseMessage.push(saveMessage(result, index));
  });
  const resultMessage = await Promise.all(promiseMessage).catch((error) => {
    throw new Error(error.message);
  });

  resultMessage.forEach((result) => {
    conversation.messages.push(result._id);
  });
  await conversation.save();

  return {
    status: 200,
    msg: { resultMessage },
  };
};

/* ---------- DELETE MESSAGE IN GROUP CHAT SERVICE (THU HỒI) ---------- */
export const deleteGroupChatMessageService = async (
  user,
  conversationId,
  messageId
) => {
  const userId = user._id.toString();

  const resultFind = await Promise.all([
    await Conversation.findById(conversationId),
    await Message.findById(messageId),
  ]).catch((error) => {
    throw new Error(error.message);
  });

  const conversation = resultFind[0];
  const message = resultFind[1];

  if (message.senderId.toString() !== userId) {
    return {
      status: 400,
      msg: "You don't have permission to delete this message",
    };
  }

  const resultDelete = await Promise.all([
    conversation.updateOne({
      $pull: {
        messages: messageId,
      },
    }),
    Message.findByIdAndDelete(messageId),
  ]).catch((error) => {
    throw new Error(error.message);
  });

  const delMessage = resultDelete[1];

  return {
    status: 200,
    msg: delMessage,
  };
};
