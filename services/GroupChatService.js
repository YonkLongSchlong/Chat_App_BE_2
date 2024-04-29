import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { s3 } from "../utils/configAWS.js";
import { getReceiverSocketId, getUserSocketId, io } from "../utils/socket.js";

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
        status: 1,
        conversationImage:
            "https://essentialstuff.s3.ap-southeast-1.amazonaws.com/2352167.png",
        conversationType: "Group",
    });

    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId) {
            io.to(participantSocketId).emit("newConversation", conversation);
        }
    });

    return {
        status: 200,
        msg: conversation,
    };
};

/* ---------- GET MESSAGES FROM GROUP CHAT SERVICE ---------- */
export const getGroupChatMessagesService = async (conversationId) => {
    const messages = await Message.find({ conversationId: conversationId });

    if (messages.length == 0) {
        return {
            status: 200,
            msg: [],
        };
    }

    return {
        status: 200,
        msg: messages,
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

    if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    }

    if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
        };
    }

    let newMessage = new Message({
        senderId: userId,
        conversationId: conversation._id,
        message: message,
        messageType: "text",
    });

    if (newMessage) {
        conversation.lastMessage = newMessage._id;
        const result = await Promise.all([
            conversation.save(),
            newMessage.save(),
        ]).catch((error) => {
            throw new Error(error.message);
        });

        io.to(conversation._id.toString()).emit("newMessage", newMessage);
        conversation.participants.forEach((participant) => {
            const participantSocketId = getReceiverSocketId(
                participant._id.toString()
            );
            if (participantSocketId) {
                io.to(participantSocketId).emit("notification");
            }
        });

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

    if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    }

    if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
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

    const lastMessage = resultMessage[resultMessage.length - 1];
    conversation.lastMessage = lastMessage._id;
    await conversation.save();

    io.to(conversation._id.toString()).emit("newMessage", resultMessage);
    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId) {
            io.to(participantSocketId).emit("notification");
        }
    });

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

    if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    }

    if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
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

    const lastMessage = resultMessage[resultMessage.length - 1];
    conversation.lastMessage = lastMessage._id;
    await conversation.save();

    io.to(conversation._id.toString()).emit("newMessage", resultMessage);
    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId) {
            io.to(participantSocketId).emit("notification");
        }
    });

    return {
        status: 200,
        msg: { resultMessage },
    };
};

/* ---------- SHARE GROUP CHAT MESSAGE SERVICE ---------- */
export const shareGroupChatMessageService = async (
    user,
    conversationId,
    messageId
) => {
    const userId = user._id.toString();
    const message = await Message.findById(messageId);
    if (!message) {
        return {
            status: 404,
            msg: "Message not found",
        };
    }

    const conversation = await Conversation.findById(conversationId);

    if (conversation) {
        let newMessage = {};
        if (message.messageType == "text") {
            newMessage = await Message.create({
                senderId: userId,
                receiverId: conversation._id.toString(),
                messageType: "text",
                message: message.message,
            });
        } else if (message.messageType == "image") {
            newMessage = await Message.create({
                senderId: userId,
                receiverId: conversation._id.toString(),
                messageType: "image",
                message: message.message,
                messageUrl: message.messageUrl,
            });
        } else {
            newMessage = await Message.create({
                senderId: userId,
                receiverId: conversation._id.toString(),
                messageType: "file",
                message: message.message,
                messageUrl: message.messageUrl,
            });
        }

        conversation.messages.push(newMessage._id);
        await conversation.save();

        conversation.participants.forEach((participant) => {
            const participantSocketId = getReceiverSocketId(
                participant._id.toString()
            );
            if (participantSocketId) {
                io.to(participantSocketId).emit("notification");
            }
        });
        io.to(conversation._id.toString()).emit("newMessage", newMessage);

        return {
            status: 200,
            msg: { conversation, newMessage },
        };
    }
};

/* ---------- DELETE MESSAGE IN GROUP CHAT SERVICE (THU HỒI) ---------- */
export const deleteGroupChatMessageService = async (
    user,
    conversationId,
    messageId
) => {
    const userId = user._id.toString();
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }

    const resultFind = await Promise.all([
        await Message.find({ conversationId: conversation._id }),
        await Message.findById(messageId),
    ]).catch((error) => {
        throw new Error(error.message);
    });

    const messages = resultFind[0];
    const message = resultFind[1];

    if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
        };
    }

    if (message.senderId.toString() !== userId) {
        return {
            status: 400,
            msg: "You don't have permission to delete this message",
        };
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage._id !== conversation.lastMessage && lastMessage !== null) {
        conversation.lastMessage = lastMessage._id;
    } else {
        conversation.lastMessage = "";
    }

    const resultDelete = await Promise.all([
        conversation.save(),
        Message.findByIdAndDelete(messageId),
    ]).catch((error) => {
        throw new Error(error.message);
    });

    const delMessage = resultDelete[1];

    io.to(conversation._id.toString()).emit("delMessage", delMessage);
    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId) {
            io.to(participantSocketId).emit("notification");
        }
    });

    return {
        status: 200,
        msg: delMessage,
    };
};

/* ---------- ADD PARTICIPANT TO GROUP  ---------- */
export const addToGroupChatService = async (
    user,
    conversationId,
    participantId
) => {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }

    if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation have been retired",
        };
    }

    const participant = await User.findById(participantId);
    if (participant) {
        conversation.participants.push(participant._id);
        await conversation.save();
    }

    const participantSocketIdAdd = getReceiverSocketId(participantId);
    if (participantSocketIdAdd) {
        io.to(participantSocketIdAdd).emit("newConversation", conversation);
    }

    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (
            participantSocketId &&
            participantSocketId != participantSocketIdAdd
        ) {
            io.to(participantSocketId).emit("notification");
            io.to(participantSocketId).emit("updateGroupChat");
        }
    });

    return {
        status: 200,
        msg: conversation,
    };
};

/* ---------- REMOVE PARTICIPANT FROM GROUP  ---------- */
export const removeFromGroupChatService = async (
    user,
    conversationId,
    participantId
) => {
    let conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }

    if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation have been retired",
        };
    }

    const participant = await User.findById(participantId);
    if (!participant) {
        return {
            status: 404,
            msg: "Participant not found",
        };
    }

    await conversation.updateOne({
        $pull: {
            participants: participantId,
        },
    });

    conversation = await Conversation.findById(conversationId);

    const participantSocketIdAdd = getReceiverSocketId(participantId);
    if (participantSocketIdAdd) {
        io.to(participantSocketIdAdd).emit("delConversation", conversation);
        io.to(participantSocketIdAdd).emit("remove");
    }

    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (
            participantSocketId &&
            participantSocketId != participantSocketIdAdd
        ) {
            io.to(participantSocketId).emit("notification");
            io.to(participantSocketId).emit("updateGroupChat");
        }
    });

    return {
        status: 200,
        msg: conversation,
    };
};

/* ---------- CLOSE GROUP  ---------- */
export const closeGroupChatService = async (user, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }

    conversation.status = 2;
    await conversation.save();

    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId) {
            io.to(participantSocketId).emit("notification");
            io.to(participantSocketId).emit("close");
        }
    });

    return {
        status: 200,
        msg: conversation,
    };
};

/* ---------- GET PARTICIPANTS FROM GROUP  ---------- */
export const getParticipantsFromGroupService = async (user, conversationId) => {
    const conversation = await Conversation.findById(conversationId).populate(
        "participants"
    );

    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }

    return {
        status: 200,
        msg: conversation.participants,
    };
};
