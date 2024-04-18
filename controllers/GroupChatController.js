import {
  addToGroupChatService,
  closeGroupChatService,
  createGroupChatService,
  deleteGroupChatMessageService,
  getGroupChatMessagesService,
  removeFromGroupChatService,
  sendGroupChatFilesService,
  sendGroupChatImagesService,
  sendGroupChatMessageService,
  shareGroupChatMessageService,
} from "../services/GroupChatService.js";

/* ---------- CREATE GROUP CHAT ---------- */
export const createGroupChat = async (req, res) => {
  try {
    const user = req.user;
    const { participantsId, conversationName } = req.body;
    const response = await createGroupChatService(
      user,
      participantsId,
      conversationName
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error creating group chat", msg: error.message });
  }
};

/* ---------- GET MESSAGES FROM GROUP CHAT ---------- */
export const getGroupChatMessages = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId } = req.params;
    const response = await getGroupChatMessagesService(user, conversationId);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Error in getting group chat messages",
      msg: error.message,
    });
  }
};

/* ---------- SEND MESSAGE TO GROUP CHAT ---------- */
export const sendGroupChatMessage = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId, message } = req.body;
    const response = await sendGroupChatMessageService(
      user,
      conversationId,
      message
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Error in sending group chat messages",
      msg: error.message,
    });
  }
};

/* ---------- SEND IMAGES TO GROUP CHAT ---------- */
export const sendGroupChatImages = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId } = req.body;
    const files = req.files;

    const response = await sendGroupChatImagesService(
      user,
      conversationId,
      files
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error in seding images", msg: error.message });
  }
};

/* ---------- SEND FILES TO GROUP CHAT ---------- */
export const sendGroupChatFiles = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId } = req.body;
    const files = req.files;
    const response = await sendGroupChatFilesService(
      user,
      conversationId,
      files
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error in seding files", msg: error.message });
  }
};

/* ---------- SHARE MESSAGE TO GROUP CHAT ---------- */
export const shareGroupChatMessage = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId, messageId } = req.body;
    const resposne = await shareGroupChatMessageService(
      user,
      conversationId,
      messageId
    );
    return res.status(resposne.status).json(resposne.msg);
  } catch (error) {
    return res
      .status(resposne.status)
      .json({ Error: "Errorin sharing group message", msg: error.message });
  }
};

/* ---------- DELETE MESSAGE IN GROUP CHAT (THU HỒI) ---------- */
export const deleteGroupChatMessage = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId, messageId } = req.body;
    const response = await deleteGroupChatMessageService(
      user,
      conversationId,
      messageId
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Error in deleting group chat message",
      msg: error.message,
    });
  }
};

/* ---------- ADD PARTICIPANT TO GROUP CHAT ---------- */
export const addToGroupChat = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId, participantId } = req.body;
    const response = await addToGroupChatService(
      user,
      conversationId,
      participantId
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Error in adding participant to group chat",
      msg: error.message,
    });
  }
};

/* ---------- REMOVE PARTICIPANT FROM GROUP CHAT ---------- */
export const removeFromGroupChat = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId, participantId } = req.body;
    const response = await removeFromGroupChatService(
      user,
      conversationId,
      participantId
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Error in remove participant from group chat",
      msg: error.message,
    });
  }
};

/* ---------- CLOSE GROUP CHAT ---------- */
export const closeGroupChat = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId } = req.body;
    const response = await closeGroupChatService(user, conversationId);
    res.status(response.status).json(response.msg);
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Error in closing group chat", msg: error.msg });
  }
};
