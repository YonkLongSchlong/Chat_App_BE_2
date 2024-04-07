import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    // let { jwt, refresh_jwt } = req.cookies;

    /* Nếu ko có token trả về Access denied */
    if (!token) {
      return res.status(403).json("Access denied");
    }

    /* Lấy token */
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    /* Decode token để lấy id, tìm user đó bằng id và đẩy vào middleware tiếp theo */
    const decoded = jwt.decode(token);
    const user = await User.findById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Error verifying token", msg: error.message });
  }
};
