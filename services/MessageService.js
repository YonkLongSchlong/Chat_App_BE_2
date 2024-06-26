import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getReceiverSocketId, getUserSocketId, io } from "../utils/socket.js";
import {
    uploadFileToS3,
    uploadImageToS3,
    uploadVideoToS3,
} from "../utils/uploadToS3.js";

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
        conversation = await Conversation.create({
            participants: [userId.toString(), receiverId],
            conversationType: "1v1",
        });
        const newMessage = await Message.create({
            senderId: userId.toString(),
            conversationId: conversation._id,
            messageType: "text",
            visibility: [receiverId, userId],
            message,
        });

        conversation.lastMessage = newMessage._id;
        conversation = await conversation
            .save()
            .then((conversation) =>
                conversation.populate(["participants", "lastMessage"])
            )
            .then((conversation) => conversation);

        const userSocketId = getUserSocketId(userId.toString());
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (userSocketId && receiverSocketId) {
            io.to(receiverSocketId)
                .to(userSocketId)
                .emit("newConversation", conversation);
            io.to(receiverSocketId).emit("newMessage", newMessage);
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
            conversationId: conversation._id,
            messageType: "text",
            visibility: [userId, receiverId],
            message,
        });

        if (newMessage) {
            conversation.lastMessage = newMessage._id;
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
    /* Function tạo và lưu messages mới */
    function saveMessage(result, index) {
        const newMessage = new Message({
            senderId: userId,
            conversationId: conversation._id,
            messageType: "image",
            messageUrl: result.Location,
            message: files[index].originalname,
            visibility: [user._id.toString(), receiverId],
        });
        return newMessage.save();
    }

    /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa */
    const userId = user._id.toString();
    let conversation = await Conversation.findOne({
        participants: { $all: [userId, receiverId], $size: 2 },
    });

    /* Nếu chưa tạo conversation mới */
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId, receiverId],
            conversationType: "1v1",
        });

        const promiseUpload = [];
        files.forEach((file) => {
            promiseUpload.push(uploadImageToS3(file, userId));
        });
        const resultUpload = await Promise.all(promiseUpload).catch((error) => {
            throw new Error(error.message);
        });

        /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
        const promiseMessage = [];
        resultUpload.forEach((result, index) => {
            promiseMessage.push(saveMessage(result, index));
        });
        const resultMessage = await Promise.all(promiseMessage).catch(
            (error) => {
                throw new Error(error.message);
            }
        );

        /* Lưu messages id vào conversation */
        if (resultMessage) {
            conversation.lastMessage = resultMessage[resultMessage.length - 1];
            await conversation
                .save()
                .then((conversation) =>
                    conversation.populate(["participants", "lastMessage"])
                )
                .then((conversation) => conversation);

            const userSocketId = getUserSocketId(userId.toString());
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId && userSocketId) {
                io.to(receiverSocketId)
                    .to(userSocketId)
                    .emit("newConversation", conversation);
                io.to(receiverSocketId).emit("newMessage", resultMessage);
            } else {
                io.to(userSocketId).emit("newConversation", conversation);
            }

            return {
                status: 200,
                msg: { resultMessage },
            };
        }
    }

    if (conversation) {
        /* Đẩy các promise upaload ảnh lên s3 vào trong mảng promiseUpload để promise all */
        const promiseUpload = [];
        files.forEach((file) => {
            promiseUpload.push(uploadImageToS3(file, userId));
        });
        const resultUpload = await Promise.all(promiseUpload).catch((error) => {
            throw new Error(error.message);
        });

        /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
        const promiseMessage = [];
        resultUpload.forEach((result, index) => {
            promiseMessage.push(saveMessage(result, index));
        });
        const resultMessage = await Promise.all(promiseMessage).catch(
            (error) => {
                throw new Error(error.message);
            }
        );

        /* Lưu messages id vào conversation */
        if (resultMessage) {
            conversation.lastMessage = resultMessage[resultMessage.length - 1];
            await conversation.save();

            const userSocketId = getUserSocketId(userId.toString());
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId && userSocketId) {
                io.to(receiverSocketId).emit("newMessage", resultMessage);
                io.to(receiverSocketId).to(userSocketId).emit("notification");
            } else {
                io.to(userSocketId).emit("notification");
            }

            return {
                status: 200,
                msg: { resultMessage },
            };
        }
    }
};

/* ---------- SEND FILE SERVICE ---------- */
export const sendFileService = async (user, receiverId, files) => {
    /* Function tạo và lưu messages mới */
    function saveMessage(result, index) {
        const newMessage = new Message({
            senderId: userId,
            conversationId: conversation._id,
            messageType: "file",
            messageUrl: result.Location,
            message: files[index].originalname,
            visibility: [user._id.toString(), receiverId],
        });
        return newMessage.save();
    }

    /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa */
    const userId = user._id.toString();
    let conversation = await Conversation.findOne({
        participants: { $all: [userId, receiverId], $size: 2 },
    });

    /* Nếu chưa tạo conversation mới */
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId, receiverId],
            conversationType: "1v1",
        });

        /* Đẩy các promise upaload ảnh lên s3 vào trong mảng promiseUpload để promise all */
        const promiseUpload = [];
        files.forEach((file) => {
            promiseUpload.push(uploadFileToS3(file, userId));
        });
        const resultUpload = await Promise.all(promiseUpload).catch((error) => {
            throw new Error(error.message);
        });

        /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
        const promiseMessage = [];
        resultUpload.forEach((result, index) => {
            promiseMessage.push(saveMessage(result, index));
        });
        const resultMessage = await Promise.all(promiseMessage).catch(
            (error) => {
                throw new Error(error.message);
            }
        );

        /* Lưu messages id vào conversation */
        conversation.lastMessage = resultMessage[resultMessage.length - 1];
        await conversation
            .save()
            .then((conversation) =>
                conversation.populate(["participants", "lastMessage"])
            )
            .then((conversation) => conversation);

        const userSocketId = getUserSocketId(userId.toString());
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId && userSocketId) {
            io.to(receiverSocketId)
                .to(userSocketId)
                .emit("newConversation", conversation);
            io.to(receiverSocketId).emit("newMessage", resultMessage);
        } else {
            io.to(userSocketId).emit("newConversation", conversation);
        }

        return {
            status: 200,
            msg: { resultMessage },
        };
    }

    if (conversation) {
        /* Đẩy các promise upaload ảnh lên s3 vào trong mảng promiseUpload để promise all */
        const promiseUpload = [];
        files.forEach((file) => {
            promiseUpload.push(uploadFileToS3(file, userId));
        });
        const resultUpload = await Promise.all(promiseUpload).catch((error) => {
            throw new Error(error.message);
        });

        /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
        const promiseMessage = [];
        resultUpload.forEach((result, index) => {
            promiseMessage.push(saveMessage(result, index));
        });
        const resultMessage = await Promise.all(promiseMessage).catch(
            (error) => {
                throw new Error(error.message);
            }
        );

        /* Lưu messages id vào conversation */
        conversation.lastMessage = resultMessage[resultMessage.length - 1];
        await conversation.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        const userSocketId = getUserSocketId(userId);
        if (receiverSocketId && userSocketId) {
            io.to(receiverSocketId).emit("newMessage", resultMessage);
            io.to(receiverSocketId).to(userSocketId).emit("notification");
        } else {
            io.to(userSocketId).emit("notification");
        }

        return {
            status: 200,
            msg: { resultMessage },
        };
    }
};

/* ---------- SEND VIDEO SERVICE ---------- */
export const sendVideoService = async (user, receiverId, files) => {
    /* Function tạo và lưu messages mới */
    function saveMessage(result, index) {
        const newMessage = new Message({
            senderId: userId,
            conversationId: conversation._id,
            messageType: "video",
            messageUrl: result.Location,
            message: files[index].originalname,
            visibility: [user._id.toString(), receiverId],
        });
        return newMessage.save();
    }

    /* Tìm xem 2 người đã từng gửi tin nhắn với nhau hay chưa */
    const userId = user._id.toString();
    let conversation = await Conversation.findOne({
        participants: { $all: [userId, receiverId], $size: 2 },
    });

    /* Nếu chưa tạo conversation mới */
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId, receiverId],
            conversationType: "1v1",
        });

        /* Đẩy các promise upaload ảnh lên s3 vào trong mảng promiseUpload để promise all */
        const promiseUpload = [];
        files.forEach((file) => {
            promiseUpload.push(uploadVideoToS3(file, userId));
        });
        const resultUpload = await Promise.all(promiseUpload).catch((error) => {
            throw new Error(error.message);
        });

        /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
        const promiseMessage = [];
        resultUpload.forEach((result, index) => {
            promiseMessage.push(saveMessage(result, index));
        });
        const resultMessage = await Promise.all(promiseMessage).catch(
            (error) => {
                throw new Error(error.message);
            }
        );

        /* Lưu messages id vào conversation */
        conversation.lastMessage = resultMessage[resultMessage.length - 1];
        await conversation
            .save()
            .then((conversation) =>
                conversation.populate(["participants", "lastMessage"])
            )
            .then((conversation) => conversation);

        const userSocketId = getUserSocketId(userId.toString());
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId && userSocketId) {
            io.to(receiverSocketId)
                .to(userSocketId)
                .emit("newConversation", conversation);
            io.to(receiverSocketId).emit("newMessage", resultMessage);
        } else {
            io.to(userSocketId).emit("newConversation", conversation);
        }

        return {
            status: 200,
            msg: { resultMessage },
        };
    }

    if (conversation) {
        /* Đẩy các promise upaload ảnh lên s3 vào trong mảng promiseUpload để promise all */
        const promiseUpload = [];
        files.forEach((file) => {
            promiseUpload.push(uploadVideoToS3(file, userId));
        });
        const resultUpload = await Promise.all(promiseUpload).catch((error) => {
            throw new Error(error.message);
        });

        /* Đẩy các promise tạo messages mới vào mảng promiseMessage để prmomise all*/
        const promiseMessage = [];
        resultUpload.forEach((result, index) => {
            promiseMessage.push(saveMessage(result, index));
        });
        const resultMessage = await Promise.all(promiseMessage).catch(
            (error) => {
                throw new Error(error.message);
            }
        );

        /* Lưu messages id vào conversation */
        conversation.lastMessage = resultMessage[resultMessage.length - 1];
        await conversation.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        const userSocketId = getUserSocketId(userId);
        if (receiverSocketId && userSocketId) {
            io.to(receiverSocketId).emit("newMessage", resultMessage);
            io.to(receiverSocketId).to(userSocketId).emit("notification");
        } else {
            io.to(userSocketId).emit("notification");
        }

        return {
            status: 200,
            msg: { resultMessage },
        };
    }
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
        let newMessage = {};
        if (message.messageType == "text") {
            conversation = await Conversation.create({
                participants: [userId, receiverId],
                conversationType: "1v1",
            });
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id,
                messageType: "text",
                message: message.message,
                visibility: [userId, receiverId],
            });
        } else if (message.messageType == "image") {
            conversation = await Conversation.create({
                participants: [userId, receiverId],
                conversationType: "1v1",
            });
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id,
                messageType: "image",
                message: message.message,
                messageUrl: message.messageUrl,
                visibility: [userId, receiverId],
            });
        } else if (message.messageType == "file") {
            conversation = await Conversation.create({
                participants: [userId, receiverId],
                conversationType: "1v1",
            });
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id,
                messageType: "file",
                message: message.message,
                messageUrl: message.messageUrl,
                visibility: [userId, receiverId],
            });
        } else {
            conversation = await Conversation.create({
                participants: [userId, receiverId],
                conversationType: "1v1",
            });
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id,
                messageType: "video",
                message: message.message,
                messageUrl: message.messageUrl,
                visibility: [userId, receiverId],
            });
        }

        conversation.lastMessage = newMessage._id;
        await conversation
            .save()
            .then((conversation) =>
                conversation.populate(["participants", "lastMessage"])
            )
            .then((conversation) => conversation);

        const userSocketId = getUserSocketId(userId);
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (userSocketId && receiverSocketId) {
            io.to(receiverSocketId)
                .to(userSocketId)
                .emit("newConversation", conversation);
            io.to(receiverSocketId).emit("newMessage", resultMessage);
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
                conversationId: conversation._id,
                messageType: "text",
                message: message.message,
                visibility: [userId, receiverId],
            });
        } else if (message.messageType == "image") {
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id,
                messageType: "image",
                message: message.message,
                messageUrl: message.messageUrl,
                visibility: [userId, receiverId],
            });
        } else if (message.messageType == "file") {
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id,
                messageType: "file",
                message: message.message,
                messageUrl: message.messageUrl,
                visibility: [userId, receiverId],
            });
        } else {
            newMessage = await Message.create({
                senderId: userId,
                conversationId: conversation._id,
                messageType: "video",
                message: message.message,
                messageUrl: message.messageUrl,
                visibility: [userId, receiverId],
            });
        }

        conversation.lastMessage = newMessage._id;
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

/* ---------- REVOKE MESSAGE SERVICE (THU HỒI) ---------- */
export const revokeMessageService = async (user, participantId, messageId) => {
    const userId = user._id.toString();

    /* Tìm conversation của user và người nhận */
    const conversation = await Conversation.findOne({
        participants: { $all: [userId, participantId], $size: 2 },
    });
    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }

    /* Tìm message theo Id */
    const message = await Message.findById(messageId);
    if (!message) {
        return {
            status: 404,
            msg: "Message not found",
        };
    }

    /* Chỉ cho chép thu hồi tin nhắn của bản thân */
    if (message.senderId.toString() !== userId) {
        return {
            status: 400,
            msg: "You dont't have permission to revoke this message",
        };
    }

    /* Tìm các messages thuộc conversation, xóa message theo id */

    const messageDocs = await Message.findByIdAndDelete(messageId);
    const messages = await Message.find({ conversationId: conversation._id });

    /* Xóa conversation nếu không còn message nào thuộc conversation */
    if (messages.length == 0) {
        const conversationDocs = await Conversation.findByIdAndDelete(
            conversation._id
        );
        const receiverSocketId = getReceiverSocketId(participantId);
        const userSocketId = getUserSocketId(userId);
        io.to(receiverSocketId).emit("delMessage", messageDocs);
        io.to(receiverSocketId)
            .to(userSocketId)
            .emit("delConversation", conversationDocs);

        return {
            status: 200,
            msg: messageDocs,
        };
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage._id != conversation.lastMessage) {
        conversation.lastMessage = lastMessage._id;
        await conversation.save();
    }

    const receiverSocketId = getReceiverSocketId(participantId);
    const userSocketId = getUserSocketId(userId);
    if (receiverSocketId && userSocketId) {
        io.to(receiverSocketId).emit("delMessage", messageDocs);
        io.to(receiverSocketId).to(userSocketId).emit("notification");
    } else {
        io.to(userSocketId).emit("notification");
    }

    return {
        status: 200,
        msg: messageDocs,
    };
};

/* ---------- DELETE MESSAGE SERVICE ---------- */
export const deleteMessageService = async (user, messageId, participantId) => {
    const userId = user._id.toString();

    /* Tìm message theo Id */
    const message = await Message.findById(messageId);
    if (!message) {
        return {
            status: 404,
            msg: "Message not found",
        };
    }

    message.visibility = message.visibility.filter((id) => {
        if (id.toString() !== userId) {
            return id;
        }
    });

    await message.save();

    if (message.visibility.length == 0) {
        const messageDocs = await Message.findByIdAndDelete(messageId);

        let conversation = await Conversation.findOne({
            participants: { $all: [userId, participantId], $size: 2 },
        });

        if (conversation.lastMessage.toString() == messageDocs._id.toString()) {
            console.log("Here");
            const messages = await Message.find({
                conversationId: conversation._id,
            });

            if (messages.length > 1) {
                conversation.lastMessage = messages[messages.length - 1];
                await conversation.save();
                conversation.participants.forEach((id) => {
                    const userSocketId = getUserSocketId(id);
                    if (userSocketId) io.emit("notification");
                });
            } else if (messages.length === 0) {
                const conversationDocs = await Conversation.findByIdAndDelete(
                    conversation._id
                );
                conversation.participants.forEach((id) => {
                    const userSocketId = getUserSocketId(id);
                    if (userSocketId)
                        io.emit("delConversation", conversationDocs);
                });
            } else {
                conversation.lastMessage = messages[0]._id;
                await conversation.save();
                conversation.participants.forEach((id) => {
                    const userSocketId = getUserSocketId(id);
                    if (userSocketId) io.emit("notification");
                });
            }
        }

        return {
            status: 200,
            msg: messageDocs,
        };
    }

    return {
        status: 200,
        msg: message,
    };
};

/* ---------- GET MESSAGES SERVICE ---------- */
export const getMessageService = async (user, userToChatId) => {
    const userId = user._id;

    /* Tìm conversation và messages của 2 người */
    const conversation = await Conversation.findOne({
        participants: { $all: [userId, userToChatId], $size: 2 },
    });

    /* Nếu không tìm thấy cuộc trò chuyện trả về mảng rỗng */
    if (!conversation) {
        return {
            status: 200,
            msg: [],
        };
    }

    /* Tìm tất cả messages thuộc conversation */
    const messages = await Message.find({
        conversationId: conversation._id,
    }).sort({
        createdAt: 1,
    });

    /* Nếu tìm thấy trả về messages trong conversation */
    return {
        status: 200,
        msg: messages,
    };
};

/* ---------- GET CONVERSATIONS SERVICE ---------- */
export const getConversationsService = async (user) => {
    /* Tìm tất cả conversations mà user có */
    const conversations = await Conversation.find({
        participants: {
            $in: [user._id],
        },
    })
        .sort({ updatedAt: -1 })
        .populate("participants lastMessage");

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
export const getConversationService = async (conversationId) => {
    /* Tìm conversation theo id */
    const conversation = await Conversation.findById(conversationId).populate(
        "participants lastMessage"
    );
    /* Nếu ko tìm thấy trả về 404 */
    if (!conversation) {
        return {
            status: 404,
            msg: "Conversation not found",
        };
    }
    return {
        status: 200,
        msg: conversation,
    };
};
