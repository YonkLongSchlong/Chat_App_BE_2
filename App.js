import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoute from "./routes/AuthRoute.js";
import friendsRoute from "./routes/FriendsRoute.js";
import groupChatRoute from "./routes/GroupChatRoute.js";
import messagesRoute from "./routes/MessagesRoute.js";
import userRoute from "./routes/UserRoute.js";
import { app, server } from "./utils/socket.js";

/* ---------- CONFIG ---------- */
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser());

const corsOpts = {
    origin: "*",

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Access-Control-Allow-Origin",
    ],
};

app.use(cors(corsOpts));

/* ---------- AUTH ROUTE ---------- */
app.use("/auth", authRoute);

/* ---------- USER ROUTES ---------- */
app.use("/user", userRoute);

/* ---------- FRIENDS ROUTES ---------- */
app.use("/friends", friendsRoute);

/* ---------- CHAT ROUTES ---------- */
app.use("/messages", messagesRoute);

/* ---------- GROUP CHAT ROUTES ---------- */
app.use("/group", groupChatRoute);

/* ---------- CONNECT DB ---------- */
mongoose
    .connect(process.env.MONGO_URI)
    .then(
        server.listen(process.env.PORT, () => {
            console.log("Listening on port " + process.env.PORT);
        })
    )
    .catch((error) => {
        console.log(error);
    });
