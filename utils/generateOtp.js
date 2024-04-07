import OtpGenerator from "otp-generator";

export const generateOtp = () => {
  const otp = OtpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};
