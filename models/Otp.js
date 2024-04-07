import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  phone: {
    type: String,
  },
  otp: {
    type: String,
  },
  created: {
    type: Date,
    default: Date.now(),
    index: { expires: 20 },
  },
});

const Otp = mongoose.model("Otp", OtpSchema);
export default Otp;
