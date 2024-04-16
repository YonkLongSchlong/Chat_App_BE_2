import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/AuthRoute.js";
import userRoute from "./routes/UserRoute.js";
import friendsRoute from "./routes/FriendsRoute.js";
import messagesRoute from "./routes/MessagesRoute.js";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import { app, server } from "./utils/socket.js";
/* ---------- CONFIG ---------- */

dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser());
// app.use(cors());
// // Cấu hình Cors
// app.use(function(req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   next();
// });
const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
  ],

  allowedHeaders: [
    "Origin", 
    "X-Requested-With", 
    "Content-Type", 
    "Accept", 
    "Authorization",
    "Access-Control-Allow-Origin"
  ],
};

app.use(cors(corsOpts));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* ---------- AUTH ROUTE ---------- */
app.use("/auth", authRoute);

/* ---------- USER ROUTES ---------- */
app.use("/user", userRoute);

/* ---------- FRIENDS ROUTES ---------- */
app.use("/friends", friendsRoute);

/* ---------- CHAT ROUTES ---------- */
app.use("/messages", messagesRoute);

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
