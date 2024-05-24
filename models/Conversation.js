import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        id: mongoose.Schema.ObjectId,
        name: {
            type: String,
        },
        participants: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User",
            },
        ],
        conversationType: {
            type: String,
        },
        status: {
            type: Number,
        },
        conversationImage: {
            type: String,
        },
        lastMessage: {
            type: mongoose.Schema.ObjectId,
            ref: "Message",
        },
        admin: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: false,
            },
        ],
    },
    { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
