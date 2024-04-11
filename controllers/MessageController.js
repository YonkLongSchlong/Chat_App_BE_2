import {
  getConversationsService,
  getMessageService,
  sendMessageService,
} from "../services/MessageService.js";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
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

// Post conversation
const createConversation = async (req, res) => {

  const { userID, friendID, userName, friendName } = req.body;

  try {
    // Create a new conversation
    const newConversation = new Conversation({
      name: `${userName} and ${friendName}`,
      participants: [userID, friendID],
    });

    // Save the conversation
    const savedConversation = await newConversation.save();

    // Send the response
    return res.status(200).json(savedConversation);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Error in creating a new conversation", msg: error.message });
  }
};
// Post message
const postMessage = async (req, res) => {

  const { conversationID} = req.body;

 // từ conversationID tìm ra message chứa conversationID đó
 const messages = await Message.find({ conversationID: conversationID });

 console.log("Messages:", messages);

 // hiển thị message
 return res.status(200).json(messages);
};

export { sendMessage, getMessages, getConversations,createConversation, postMessage  };
