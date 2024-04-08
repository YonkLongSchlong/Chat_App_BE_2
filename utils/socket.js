import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: ["http://localhost:5000"],
  method: ["GET", "POST", "PUT", "PATCH"],
});

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId, socketId}

io.on("connection", (socket) => {
  console.log("A user connecte", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId !== "undefined") userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnect", socket.id);
    delete userSocketMap(userId);
    io.emit("getOnlineUser", Object.keys(userSocketMap));
  });
});

export { app, server, io, getReceiverSocketId };
