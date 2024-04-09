import {
  getConversationsService,
  getMessageService,
  sendMessageService,
} from "../services/MessageService.js";

/* ---------- SEND MESSAGE ---------- */
const sendMessage = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const user = req.user;
    const { message } = req.body;

    const response = await sendMessageService(user, receiverId, message);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(404)
      .json({ Error: "Error in send message", msg: error.message });
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

export { sendMessage, getMessages, getConversations };
