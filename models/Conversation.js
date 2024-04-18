import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
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
  messages: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Message",
      default: [],
    },
  ],
  status: {
    type: Number,
  },
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
