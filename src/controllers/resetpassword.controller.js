import User from "../models/User.model.js";
import nodemailer from "nodemailer";

import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendEmail } from "../utils/email.js";
import PasswordReset from "../models/ResetPassword.model.js";
import { hashPassword } from "../utils/hashPassword.js";

export const sendResetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  // Find user by email in company or subcontractor
  const user = await User.findOne({
    $or: [
      { "companyProfile.workEmail": email },
      { "subcontractorProfile.email": email }
    ]
  });

  if (!user) throw new ApiError(404, "No user found with this email");

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to DB (expires in 10 mins)
  await PasswordReset.findOneAndUpdate(
    { email },
    { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    { upsert: true, new: true }
  );

  // Send OTP using NodeMailer
  const info = await sendEmail({
    to: email,
    subject: "Your Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
  });

  return res.status(200).json({
    success: true,
    message: "OTP sent to registered email",
    previewUrl: nodemailer.getTestMessageUrl(info), // For Ethereal testing
  });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const record = await PasswordReset.findOne({ email, otp });
  if (!record) throw new ApiError(400, "Invalid OTP");

  if (record.expiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  return res.status(200).json({ success: true, message: "OTP verified" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword)
    throw new ApiError(400, "All fields are required");

  if (newPassword !== confirmPassword)
    throw new ApiError(400, "Passwords do not match");

  const record = await PasswordReset.findOne({ email, otp });
  if (!record) throw new ApiError(400, "Invalid OTP");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP expired");

  const hashedPassword = await hashPassword(newPassword);

  // Update user password
  const user = await User.findOneAndUpdate(
    {
      $or: [
        { "companyProfile.workEmail": email },
        { "subcontractorProfile.email": email }
      ]
    },
    {
      $set: {
        "companyProfile.password": hashedPassword,
        "subcontractorProfile.password": hashedPassword
      }
    },
    { new: true }
  );

  // Delete OTP after use
  await PasswordReset.deleteOne({ email });

  return res.status(200).json({ success: true, message: "Password reset successfully" });
});