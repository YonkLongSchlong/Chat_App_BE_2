import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Message",
      default: [],
    },
  ],
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
