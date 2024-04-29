import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        id: mongoose.Schema.ObjectId,
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minLength: 6,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        avatar: {
            type: String,
            default: "https://example.com/cute-pusheen.jpg",
        },
        bio: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            required: true,
        },
        dob: {
            type: Date,
            required: true,
            default: Date.now(),
        },
        friends: [
            {
                type: mongoose.Schema.ObjectId,
                default: [],
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);
export default User;
