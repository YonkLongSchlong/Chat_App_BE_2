import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        id: mongoose.Schema.ObjectId,
        senderId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        conversationId: {
            type: mongoose.Schema.ObjectId,
            ref: "Conversation",
        },
        message: {
            type: String,
            required: true,
        },
        messageUrl: {
            type: String,
            required: false,
        },
        messageType: {
            type: String,
            required: true,
        },
        visibility: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
