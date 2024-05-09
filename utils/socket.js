import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: ["http://localhost:5000"],
    method: ["GET", "POST", "PUT", "PATCH"],
});

const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

const getUserSocketId = (userId) => {
    return userSocketMap[userId];
};

const userSocketMap = {}; // [{userId, socketId}]

io.on("connection", (socket) => {
    console.log("A user connect", socket.id);
    const userId = socket.handshake.query.userId;
    if (userId !== "undefined") userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log(Object.keys(userSocketMap));

    socket.on("join", (conversationId) => {
        socket.join(conversationId);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnect", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUser", Object.keys(userSocketMap));
    });
});

export { app, getReceiverSocketId, getUserSocketId, io, server };
