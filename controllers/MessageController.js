import {
  deleteMessageService,
  getConversationService,
  getConversationsService,
  getMessageService,
  sendFileService,
  sendImageService,
  sendMessageService,
} from "../services/MessageService.js";

/* ---------- SEND MESSAGE ---------- */
const sendMessage = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const user = req.user;
    const { message, conversationName } = req.body;

    const response = await sendMessageService(
      user,
      receiverId,
      message,
      conversationName
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(404)
      .json({ Error: "Error in send message", msg: error.message });
  }
};

/* ---------- SEND IMAGE ---------- */
const sendImage = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const user = req.user;
    const files = req.files;
    const { conversationName } = req.body;

    const response = await sendImageService(
      user,
      receiverId,
      files,
      conversationName
    );
    console.log(response.msg);
    res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(404)
      .json({ Error: "Error in send message", msg: error.message });
  }
};

/* ---------- SEND FILE ---------- */
const sendFile = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const user = req.user;
    const files = req.files;
    const { conversationName } = req.body;

    const response = await sendFileService(
      user,
      receiverId,
      files,
      conversationName
    );
    console.log(response.msg);
    res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(404)
      .json({ Error: "Error in send file", msg: error.message });
  }
};

/* ---------- GET MESSAGES ---------- */
const getMessages = async (req, res) => {
  try {
    const { userToChatId } = req.params;
    const user = req.user;
    

    const response = await getMessageService(user, userToChatId);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error in get messages", msg: error.message });
  }
};

/* ---------- GET CONVERSATIONS ---------- */
const getConversations = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const response = await getConversationsService(user, id);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error in getting conversations", msg: error.message });
  }
};

/* ---------- GET CONVERSATIONS ---------- */
const getConversation = async (req, res) => {
  try {
    const { id, conversationId } = req.params;
    const user = req.user;

    const response = await getConversationService(user, id, conversationId);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error in getting conversation", msg: error.message });
  }
};

/* ----------DELETE MESSAGE ---------- */
const deleteMessage = async (req, res) => {
  try {
    const { id, messageId, participantId } = req.params;
    const user = req.user;

    const response = await deleteMessageService(
      user,
      id,
      participantId,
      messageId
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error in delete message", msg: error.message });
  }
};

export {
  sendMessage,
  sendImage,
  sendFile,
  getMessages,
  getConversations,
  getConversation,
  deleteMessage,
};
