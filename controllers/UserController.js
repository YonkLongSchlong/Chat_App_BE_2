import User from "../models/User.js";
import {
  updateBioService,
  updatePhoneService,
  updatePasswordService,
  getUsersByPhonesService,
  uploadAvatarService,
  updateProfileService,
} from "../services/UserService.js";

/* ---------- UPDATE USER PROFILE ---------- */
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { username, gender, dob } = req.body;
    const response = await updateProfileService(
      user,
      id,
      username,
      gender,
      dob
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Update user profile failed", msg: error.message });
  }
};

/* ---------- UPDATE BIO ---------- */
const updateBio = async (req, res) => {
  try {
    const { bio } = req.body;
    const { id } = req.params;
    const user = req.user;

    const response = await updateBioService(user, id, bio);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    res.status(500).json({ Error: "Update bio failed", msg: error.message });
  }
};

/* ---------- UPDATE PHONE NUMBER ---------- */
const updatePhoneNumber = async (req, res) => {
  try {
    const { phone } = req.body;
    const { id } = req.params;
    const user = req.user;

    const response = await updatePhoneService(user, id, phone);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Update phone number failed", msg: error.message });
  }
};

/* ---------- UPDATE PASSWORD ---------- */
const updatePassword = async (req, res) => {
  try {
    const { newPassword, oldPassword } = req.body;
    const { id } = req.params;
    const user = req.user;

    const response = await updatePasswordService(
      user,
      id,
      oldPassword,
      newPassword
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Update password failed", msg: error.message });
  }
};

/* ---------- UPLOAD AVATAR ---------- */
const uploadAvatar = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const image = req.file?.originalname.split(".");
    const fileType = image[image.length - 1];
    const fileName = `${id}_${Date.now().toString()}.${fileType}`;
    const file = req.file.buffer;
    const contentType = req.file.mimetype;

    const response = await uploadAvatarService(
      user,
      id,
      fileName,
      file,
      contentType
    );
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Somethong wrong happend in upload avatar",
      msg: error.msg,
    });
  }
};

const findUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

/* ---------- GET USERS BY PHONES ---------- */
const getUsersByPhones = async (req, res) => {
  try {
    const { phones } = req.body;
    const { id } = req.params;
    const user = req.user;
    if (!phones) {
      return res.status(203).json([]);
    }

    const response = await getUsersByPhonesService(user, id, phones);
    return res.status(response.status).json(response.msg);
  } catch (error) {
    return res.status(500).json({
      Error: "Something went wrong in get users by phones",
      msg: error.message,
    });
  }
};

export {
  updateBio,
  updatePhoneNumber,
  updatePassword,
  findUser,
  getUsers,
  getUsersByPhones,
  uploadAvatar,
  updateProfile,
};
