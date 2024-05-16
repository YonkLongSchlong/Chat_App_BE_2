import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getReceiverSocketId, getUserSocketId, io } from "../utils/socket.js";
import { uploadFileToS3, uploadImageToS3 } from "../utils/uploadToS3.js";

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
        admin: [userId],
    })
        .then((conversation) => conversation.populate("participants"))
        .then((conversation) => conversation);

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
    const messages = await Message.find({
        conversationId: conversationId,
    });

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
    } else if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    } else if (conversation.status === 2) {
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

    if (!newMessage) {
        return {
            status: 500,
            msg: "Error creating message",
        };
    }

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
    } else if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
        };
    }

    /* Function tạo và lưu messages mới */
    function saveMessage(result, index) {
        const newMessage = new Message({
            senderId: userId,
            conversationId: conversationId,
            messageType: "image",
            messageUrl: result.Location,
            message: files[index].originalname,
        });
        return newMessage.save();
    }

    const promiseUpload = [];
    files.forEach((file) => {
        promiseUpload.push(uploadImageToS3(file, userId));
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
    } else if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
        };
    }

    const promiseUpload = [];
    files.forEach((file) => {
        promiseUpload.push(uploadFileToS3(file, userId));
    });
    const resultUpload = await Promise.all(promiseUpload).catch((error) => {
        throw new Error(error.message);
    });

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

/* ---------- SEND VIDEO TO GROUP CHAT SERVICE ---------- */
export const sendGroupChatVideoService = async (
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
    } else if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
        };
    }

    /* Function tạo và lưu image messages mới */
    function saveMessage(result, index) {
        const newMessage = new Message({
            senderId: userId,
            conversationId: conversationId,
            messageType: "video",
            messageUrl: result.Location,
            message: files[index].originalname,
        });
        return newMessage.save();
    }

    const promiseUpload = [];
    files.forEach((file) => {
        promiseUpload.push(uploadFileToS3(file, userId));
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

    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }

    if (conversation) {
        let newMessage = {};
        if (message.messageType == "text") {
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id.toString(),
                messageType: "text",
                message: message.message,
            });
        } else if (message.messageType == "image") {
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id.toString(),
                messageType: "image",
                message: message.message,
                messageUrl: message.messageUrl,
            });
        } else if (message.messageType == "file") {
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id.toString(),
                messageType: "file",
                message: message.message,
                messageUrl: message.messageUrl,
            });
        } else {
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id.toString(),
                messageType: "video",
                message: message.message,
                messageUrl: message.messageUrl,
            });
        }

        await conversation.updateOne({ lastMessage: newMessage._id });

        conversation.participants.forEach((participant) => {
            const participantSocketId = getReceiverSocketId(
                participant._id.toString()
            );
            if (participantSocketId) {
                io.to(participantSocketId).emit("notification");
            }
        });
        io.to(conversation._id.toString()).emit(newMessage);

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
    let conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation has been closed",
        };
    } else if (!conversation.participants.includes(userId)) {
        return {
            status: 400,
            msg: "You are not a member of this conversation",
        };
    }

    const message = await Message.findById(messageId);
    if (!message) {
        return {
            status: 404,
            msg: "Message not found",
        };
    } else if (message.senderId.toString() !== userId) {
        return {
            status: 400,
            msg: "You don't have permission to revoke this message",
        };
    }

    const delMessage = await Message.findByIdAndDelete(messageId);
    const messages = await Message.find({ conversationId });

    const lastMessage = messages[messages.length - 1];

    if (!messages.length > 0) {
        conversation.lastMessage = undefined;
        await conversation.save();

        io.to(conversation._id.toString()).emit("delMessage", delMessage);
        conversation.participants.forEach((participant) => {
            const participantSocketId = getReceiverSocketId(
                participant._id.toString()
            );
            if (participantSocketId) {
                io.to(participantSocketId).emit("notification");
            }
        });
    }

    if (lastMessage._id !== conversation.lastMessage && messages.length > 0) {
        conversation.lastMessage = lastMessage._id;
        await conversation.save();

        io.to(conversation._id.toString()).emit("delMessage", delMessage);
        conversation.participants.forEach((participant) => {
            const participantSocketId = getReceiverSocketId(
                participant._id.toString()
            );
            if (participantSocketId) {
                io.to(participantSocketId).emit("notification");
            }
        });
    }

    return {
        status: 200,
        msg: delMessage,
    };
};

/* ---------- ADD PARTICIPANT TO GROUP  ---------- */
export const addToGroupChatService = async (
    user,
    conversationId,
    participantsId
) => {
    const userId = user._id.toString();
    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation have been retired",
        };
    } else if (!conversation.admin.includes(userId)) {
        return {
            status: 400,
            msg: "You don't have permission to add users to this conversation",
        };
    }

    participantsId.forEach((participantId) => {
        conversation.participants.push(participantId);
    });
    await conversation
        .save()
        .then((conversation) => conversation.populate("participants"))
        .then((conversation) => conversation);

    participantsId.forEach((participantId) => {
        const participantSocketIdAdd = getReceiverSocketId(participantId);
        if (participantSocketIdAdd) {
            io.to(participantSocketIdAdd).emit("newConversation", conversation);
        }
    });

    const userSocketId = getUserSocketId(userId);
    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId && participantSocketId !== userSocketId) {
            io.to(participantSocketId).emit("updateGroupChat", conversation);
        }
        io.to(participantSocketId).emit("notification");
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
    const userId = user._id.toString();
    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation have been retired",
        };
    } else if (!conversation.admin.includes(userId)) {
        return {
            status: 400,
            msg: "You don't have permission to remove this user from this conversation",
        };
    }

    if (conversation.admin.includes(participantId)) {
        conversation.participants = conversation.participants.filter(
            (participant) => {
                return participant.toString() !== participantId;
            }
        );
        conversation.admin = conversation.admin.filter((participant) => {
            return participant.toString() !== participantId;
        });
        await conversation
            .save()
            .then((conversation) => conversation.populate("participants"))
            .then((conversation) => conversation);
    } else {
        conversation.participants = conversation.participants.filter(
            (participant) => {
                return participant.toString() !== participantId;
            }
        );
        await conversation
            .save()
            .then((conversation) => conversation.populate("participants"))
            .then((conversation) => conversation);
    }

    const removeParticipantSocketId = getReceiverSocketId(participantId);
    if (removeParticipantSocketId) {
        io.to(participantSocketIdAdd).emit("delConversation", conversation);
        io.to(participantSocketIdAdd).emit("remove");
    }

    const userSocketId = getUserSocketId(userId);
    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId && participantSocketId !== userSocketId) {
            io.to(participantSocketId).emit("updateGroupChat", conversation);
        }
        io.to(participantSocketId).emit("notification");
    });

    return {
        status: 200,
        msg: conversation,
    };
};

/* ---------- ADD ADMIN PERMISSION TO USER  ---------- */
export const addAdminPermissonService = async (
    user,
    conversationId,
    participantId
) => {
    const userId = user._id.toString();
    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation have been retired",
        };
    } else if (!conversation.admin.includes(userId)) {
        return {
            status: 400,
            msg: "Only admin can grant admin permission to others",
        };
    }

    const participant = await User.findById(participantId);
    if (participant && !conversation.admin.includes(participant._id)) {
        conversation.admin.push(participant._id);
        await conversation
            .save()
            .then((conversation) => conversation.populate("participants"))
            .then((conversation) => conversation);
    } else {
        return {
            status: 400,
            msg: "This user have already been an admin",
        };
    }

    const userSocketId = getUserSocketId(userId);
    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId && participantSocketId !== userSocketId) {
            io.to(participantSocketId).emit("notification");
            io.to(participantSocketId).emit("updateGroupChat", conversation);
        }
    });

    return {
        status: 200,
        msg: conversation,
    };
};

/* ---------- REVOKE ADMIN PERMISSION FROM USER  ---------- */
export const revokeAdminPermissonService = async (
    user,
    conversationId,
    participantId
) => {
    const userId = user._id.toString();
    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    } else if (conversation.status === 2) {
        return {
            status: 400,
            msg: "Conversation have been retired",
        };
    } else if (!conversation.admin.includes(userId)) {
        return {
            status: 400,
            msg: "Only admin can revoke admin permission from others",
        };
    }

    const participant = await User.findById(participantId);
    if (participant && conversation.admin.includes(participant._id)) {
        conversation.admin = conversation.admin.filter((id) => {
            return id.toString() !== participant._id.toString();
        });
        await conversation
            .save()
            .then((conversation) => conversation.populate("participants"))
            .then((conversation) => conversation);
    } else {
        return {
            status: 400,
            msg: "This user is not an admin",
        };
    }

    const userSocketId = getUserSocketId(userId);
    conversation.participants.forEach((participant) => {
        const participantSocketId = getReceiverSocketId(
            participant._id.toString()
        );
        if (participantSocketId && participantSocketId !== userSocketId) {
            io.to(participantSocketId).emit("notification");
            io.to(participantSocketId).emit("updateGroupChat", conversation);
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

    io.to(conversationId).emit("close");
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
