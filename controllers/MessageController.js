import {
    deleteMessageService,
    getConversationService,
    getConversationsService,
    getMessageService,
    sendFileService,
    sendImageService,
    sendMessageService,
    shareMessageService,
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
        res.status(response.status).json(response.msg);
    } catch (error) {
        return res
            .status(404)
            .json({ Error: "Error in send file", msg: error.message });
    }
};

/* ---------- SHARE MESSAGE ---------- */
const shareMessage = async (req, res) => {
    try {
        const user = req.user;
        const { receiverId } = req.params;
        const { messageId } = req.body;
        const response = await shareMessageService(user, receiverId, messageId);
        return res.status(response.status).json(response.msg);
    } catch (error) {
        return res
            .status(response.status)
            .json({ Error: "Error in share message", msg: error });
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

/* ---------- GET CONVERSATION ---------- */
const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const response = await getConversationService(conversationId);
        return res.status(response.status).json(response.msg);
    } catch (error) {
        return res.status(500).json({
            Error: "Error in getting conversation",
            msg: error.message,
        });
    }
};

/* ---------- GET CONVERSATIONS ---------- */
const getConversations = async (req, res) => {
    try {
        const user = req.user;
        const response = await getConversationsService(user);
        return res.status(response.status).json(response.msg);
    } catch (error) {
        return res.status(500).json({
            Error: "Error in getting conversations",
            msg: error.message,
        });
    }
};

/* ---------- DELETE MESSAGE (THU HỒI) ---------- */
const deleteMessage = async (req, res) => {
    try {
        const { participantId } = req.params;
        const { messageId } = req.body;
        const user = req.user;

        const response = await deleteMessageService(
            user,
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
    shareMessage,
    getMessages,
    getConversations,
    getConversation,
    deleteMessage,
};
