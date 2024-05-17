import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { s3 } from "../utils/configAWS.js";

dotenv.config();

/* ---------- UPDATE USER PROFILE ---------- */
export const updateProfileService = async (user, id, username, gender, dob) => {
    /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
    if (id !== user._id.toString()) {
        return {
            status: 403,
            msg: "User not verified",
        };
    }

    user.username = username;
    user.gender = gender;
    user.dob = dob;
    await user.save();
    return {
        status: 200,
        msg: user,
    };
};

/* ---------- UPDATE BIO ---------- */
export const updateBioService = async (user, id, bio) => {
    /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
    if (id !== user._id.toString()) {
        return {
            status: 403,
            msg: "User not verified",
        };
    }
    console.log("here");

    /* Đổi Bio và lưu vào DB trả về 200*/
    user.bio = bio;
    await user.save();
    return {
        status: 200,
        msg: user,
    };
};

/* ---------- UPDATE PHONE NUMBER ---------- */
export const updatePhoneService = async (user, id, phone) => {
    /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
    if (id !== user._id.toString()) {
        return {
            status: 403,
            msg: "User not verified",
        };
    }

    /* Đổi SĐT và lưu vào DB trả về 200*/
    user.phone = phone;
    await user.save();
    return {
        status: 200,
        msg: user,
    };
};

/* ---------- UPDATE PASSWORD ---------- */
export const updatePasswordService = async (
    user,
    id,
    oldPassword,
    newPassword
) => {
    /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
    if (id !== user._id.toString()) {
        return {
            status: 403,
            msg: "User not verified",
        };
    }

    /* Kiểm tra pass nếu ko hợp lệ trả về 404 */
    const checkPassword = bcryptjs.compareSync(oldPassword, user.password);
    if (!checkPassword) {
        return {
            status: 404,
            msg: "Old password does not match",
        };
    }

    /* Nếu hợp lệ hash password mới */
    const salt = bcryptjs.genSaltSync(10);
    const newHashPassword = bcryptjs.hashSync(newPassword, salt);

    /* Đổi Password và lưu vào DB trả về 200*/
    user.password = newHashPassword;
    await user.save();
    return {
        status: 200,
        msg: user,
    };
};

/* ---------- UPLOAD AVATAR ---------- */
export const uploadAvatarService = async (
    user,
    id,
    fileName,
    file,
    contentType
) => {
    /* Kiểm tra xem ID ở phần params có đúng với ID của user đã được verify hay không */
    if (user._id.toString() !== id) {
        return {
            status: 403,
            msg: "User not verified",
        };
    }
    const s3_params = {
        Bucket: process.env.S3_AVATAR_BUCKET,
        Key: fileName,
        Body: file,
        ContentType: contentType,
    };
    const data = await s3.upload(s3_params).promise();
    user.avatar = data.Location;
    user.save();
    return {
        status: 200,
        msg: user,
    };
};

/* ---------- GET USERS BY PHONES ---------- */
export const getUsersByPhonesService = async (user, id, phones) => {
    if (id !== user._id.toString()) {
        return {
            status: 401,
            msg: "User not verified",
        };
    }

    const users = await User.find({ phone: { $in: phones } });
    if (users.length > 0) {
        return {
            status: 200,
            msg: users,
        };
    }

    return {
        status: 204,
        msg: "No contacts found using this app",
    };
};

/* ---------- FIND USER BY PHONE SERVICE---------- */
export const getUserByPhoneService = async (user, phone) => {
    const userByPhone = await User.findOne({ phone: phone });

    if (!userByPhone) {
        return {
            status: 404,
            msg: "User not found",
        };
    }

    const friendRequest = await FriendRequest.findOne({
        $or: [
            { requester: user._id, recipent: userByPhone._id },
            { recipent: user._id, requester: userByPhone._id },
        ],
    });
    if (!friendRequest) {
        return {
            status: 200,
            msg: { userByPhone },
        };
    }

    delete userByPhone.password;

    return {
        status: 200,
        msg: { userByPhone, friendRequest },
    };
};
