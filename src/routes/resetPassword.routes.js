import express from "express";

import {
  resetPassword,
  sendResetOtp,
  verifyResetOtp,
} from "../controllers/resetpassword.controller.js";

const router = express.Router();

router.post("/send-otp", sendResetOtp);
router.post("/verify-otp", verifyResetOtp);
router.post("/reset", resetPassword);
export default router;
