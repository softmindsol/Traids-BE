

// ----------------------------------------
// Company Registration

import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { hashPassword } from "../utils/hashPassword.js";

// ----------------------------------------
export const registerCompany = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    phone,
    companyName,
    registrationNumber,
    vatNumber,
    industryType,
    primaryContactName,
    workEmail,
    headOfficeAddress,
    companyDocument,
    insuranceCertificate,
    healthSafetyPolicy,
  } = req.body;

  // Validate required fields
  if (!email || !password || !companyName || !industryType) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check if email exists
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new ApiError(409, "Email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create company user
  const user = await User.create({
    email,
    password: hashedPassword,
    phone,
    role: "company",
    companyProfile: {
      companyName,
      registrationNumber,
      vatNumber,
      industryType,
      primaryContactName,
      workEmail,
      phoneNumber: phone,
      headOfficeAddress,
      companyDocument,
      insuranceCertificate,
      healthSafetyPolicy,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Company registered successfully"));
});


// ----------------------------------------
// Subcontractor Registration
// ----------------------------------------
export const registerSubcontractor = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    phone,
    fullName,
    primaryTrade,
    yearsExperience,
    postcode,
    certifications,
    profilePhoto,
    dayRate,
    availability,
    professionalBio,
    workExamples,
  } = req.body;

  // Basic validation
  if (!email || !password || !fullName || !primaryTrade) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check email exists
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new ApiError(409, "Email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create subcontractor
  const user = await User.create({
    email,
    password: hashedPassword,
    phone,
    role: "subcontractor",
    subcontractorProfile: {
      fullName,
      primaryTrade,
      yearsExperience,
      postcode,
      certifications,
      profilePhoto,
      dayRate,
      availability,
      professionalBio,
      workExamples,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, user, "Subcontractor registered successfully")
    );
});
