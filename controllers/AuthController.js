import {
    findUserByTokenService,
    loginService,
    logoutService,
    registerService,
    verifyRegisterService,
} from "../services/AuthService.js";

/* ---------- REGISTER ---------- */
const register = async (req, res) => {
    try {
        const { phone, email } = req.body;
        const response = await registerService(phone, email);
        res.status(response.status).json(response.msg);
    } catch (error) {
        res.status(500).json({
            Error: "Error creating OTP",
            msg: error.message,
        });
    }
};

/* ---------- VERIFY REGISTER ---------- */
const verifyRegister = async (req, res) => {
    try {
        const { username, password, phone, email, gender, dob, otp } = req.body;
        const response = await verifyRegisterService(
            username,
            password,
            phone,
            email,
            gender,
            dob,
            otp
        );
        return res.status(response.status).json(response.msg);
    } catch (error) {
        res.status(500).json({
            Error: "Error creating user",
            msg: error.message,
        });
    }
};

/* ----------  LOGIN ----------  */
const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        const response = await loginService(res, phone, password);
        return res.status(response.status).json(response.msg);
    } catch (error) {
        res.status(500).json({
            Error: "Error loging in user",
            msg: error.message,
        });
    }
};

/* ----------  LOGOUT ----------  */
const logout = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await logoutService(req, res, id);
        res.status(response.status).json(response.msg);
    } catch (error) {
        res.status(500).json({ Error: "Error logout", msg: error.message });
    }
};

/* ----------  FIND USER BY TOKEN ----------  */
const findUserByToken = async (req, res) => {
    try {
        const user = req.user;
        const response = await findUserByTokenService(user);
        return res.status(response.status).json(response.msg);
    } catch (error) {
        return res
            .status(500)
            .json({ Error: "Error in find user by token", msg: error.message });
    }
};

export { findUserByToken, login, logout, register, verifyRegister };
