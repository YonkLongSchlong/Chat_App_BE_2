import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import { generateOtp } from "../utils/generateOtp.js";
import { generateToken } from "../utils/generateToken.js";

/* ---------- REGISTER ---------- */
export const registerService = async (phone, email) => {
    /* Tìm xem sđt đã được sử dụng hay chưa */
    const existUser = await User.findOne({ phone: phone }).lean();
    if (existUser) {
        return {
            status: 409,
            msg: "This phone number has already been registered",
        };
    }

    /* Tạo Otp */
    const genOtp = generateOtp();
    console.log("Your otp is: " + genOtp);

    /* Gửi Otp qua mail của user */
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
            user: "beeline3022@gmail.com",
            pass: "disaoxkojqjkpmdy",
        },
    });
    const info = await transporter.sendMail({
        from: '"Pandalo" <beeline3022@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Verify your account with otp", // Subject line
        text: "Your otp is: " + genOtp, // plain text body
    });

    /* Mã hóa otp */
    const salt = bcryptjs.genSaltSync(10);
    const hashOtp = bcryptjs.hashSync(genOtp, salt);
    const otp = await Otp.create({
        phone: phone,
        otp: hashOtp,
    });

    return {
        status: 200,
        msg: "Otp has been sent",
    };
};

/* ---------- VERIFY REGISTER ---------- */
export const verifyRegisterService = async (
    username,
    password,
    phone,
    email,
    gender,
    dob,
    otp
) => {
    /* Tìm OTP đã được tạo với SĐT trong DB */
    const OtpHolder = await Otp.find({ phone: phone });
    if (OtpHolder.length <= 0) {
        return {
            status: 404,
            msg: "OTP is expired",
        };
    }

    /* Lấy OTP cuối cùng được gửi và kiểm tra với OTP user nhập*/
    const lastOtp = OtpHolder[OtpHolder.length - 1];
    const validateOtp = bcryptjs.compareSync(otp, lastOtp.otp);
    if (!validateOtp) {
        return {
            status: 400,
            msg: "Invalid OTP",
        };
    }

    /* Check hợp lệ OTP và SĐT người dùng sử dụng 
       Nếu hợp lệ tạo User và lưu vào DB
    */
    if (validateOtp && phone === lastOtp.phone) {
        /* Mã hóa password trước khi lưu vào DB */
        const salt = bcryptjs.genSaltSync(10);
        const hashPassword = bcryptjs.hashSync(password, salt);

        /* Tạo user và lưu vào DB */
        const user = await User.create({
            username: username,
            password: hashPassword,
            phone: phone,
            email: email,
            gender: gender,
            dob: dob,
        });

        /* Xóa các OTP của SĐT đăng ký đã được lưu trong DB */
        if (user) {
            await Otp.deleteMany({
                phone: phone,
            });
        }

        user.password =
            undefined; /* Xóa password trước khi trả về cho người dùng */

        return {
            status: 201,
            msg: user,
        };
    }
    return {
        status: 404,
        msg: "This is not the phone number that are used to register",
    };
};

/* ----------  LOGIN ----------  */
export const loginService = async (res, phone, password) => {
    /* Tìm user có tồn tại trong DB */
    const user = await User.findOne({ phone: phone });
    if (!user) {
        return {
            status: 404,
            msg: "User not found",
        };
    }

    /* Check password */
    const validatePassword = bcryptjs.compareSync(password, user.password);
    if (!validatePassword) {
        return {
            status: 403,
            msg: "Invalid credentials",
        };
    }

    user.isLoggedIn = 1;
    await user.save();

    /* TẠO TOKEN  */
    const token = generateToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    // const refreshToken = generateRefreshToken(user._id);
    // res.cookie("refresh_jwt", refreshToken, {
    //   httpOnly: true,
    //   maxAge: 3.154e10,
    // });
    // res.setHeader("authorization", `Bearer ${token}`);

    user.password =
        undefined; /* Xóa password trước khi trả về cho người dùng */
    return {
        status: 200,
        msg: { user, token },
    };
};

/* ----------  LOGOUT ----------  */
export const logoutService = async (req, res, id) => {
    await User.findByIdAndUpdate(id, { isLoggedIn: 0 });
    res.cookie("jwt", "", { maxAge: 0, httpOnly: true });
    res.cookie("refreshToken", "", { maxAge: 0, httpOnly: true });
    res.setHeader("Authorization", "");
    return {
        status: 200,
        msg: "User logout succesfully",
    };
};
