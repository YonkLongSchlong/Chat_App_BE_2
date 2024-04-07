import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    id: mongoose.Schema.ObjectId,
    requester: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      require: true,
    },
    recipent: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      require: true,
    },
    status: {
      type: Number,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
