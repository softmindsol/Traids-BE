// ----------------------------------------
// Company Registration

import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashPassword } from "../utils/hashPassword.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ----------------------------------------
export const registerCompany = asyncHandler(async (req, res) => { 
  console.log("🚀 ~ req.body:", req.body)
  console.log("🚀 ~ req.files:", req.files)

  const {
    password,
    phoneNumber,
    companyName,
    registrationNumber,
    vatNumber,
    industryType,
    primaryContactName,
    workEmail,
    headOfficeAddress
  } = req.body;

  // Validate required fields
  if (!workEmail || !password || !companyName || !industryType) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check duplicate
  const emailExists = await User.findOne({ "companyProfile.workEmail": workEmail });
  if (emailExists) throw new ApiError(409, "Company email already exists");

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Upload files to Cloudinary
  const files = req.files || {};
  const companyDocumentUrl = files.companyDocument ? (await uploadOnCloudinary(files.companyDocument[0].path)).url : null;
  const insuranceCertUrl = files.insuranceCertificate ? (await uploadOnCloudinary(files.insuranceCertificate[0].path)).url : null;
  const healthSafetyUrl = files.healthSafetyPolicy ? (await uploadOnCloudinary(files.healthSafetyPolicy[0].path)).url : null;

  // Create company user
  const user = await User.create({
    role: "company",
    companyProfile: {
      companyName,
      registrationNumber,
      vatNumber,
      industryType,
      primaryContactName,
      workEmail,
      phoneNumber,
      password: hashedPassword,
      headOfficeAddress,
      companyDocument: companyDocumentUrl,
      insuranceCertificate: insuranceCertUrl,
      healthSafetyPolicy: healthSafetyUrl
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Company registered successfully"));
});

export const registerSubcontractor = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    fullName,
    primaryTrade,
    yearsExperience,
    postcode,
    phoneNumber,
    dayRate,
    availability,
    professionalBio,
  } = req.body;

  console.log("🚀 ~ email:", email);
  console.log("🚀 ~ req.files:", req.files);

  // Validate required fields
  if (!email || !password || !fullName || !primaryTrade) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check duplicate email
  const emailExists = await User.findOne({ "subcontractorProfile.email": email });
  if (emailExists) throw new ApiError(409, "Subcontractor email already exists");

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Upload files to Cloudinary
  const files = req.files || {};

  const profilePhotoUrl = files.profilePhoto
    ? (await uploadOnCloudinary(files.profilePhoto[0].path)).url
    : null;

  // Upload multiple work examples
  let workExampleUrls = [];
  if (files.workExamples) {
    for (const file of files.workExamples) {
      const uploaded = await uploadOnCloudinary(file.path);
      workExampleUrls.push(uploaded.url);
    }
  }

  // Upload multiple certifications
  let certificationUrls = [];
  if (files.certifications) {
    for (const file of files.certifications) {
      const uploaded = await uploadOnCloudinary(file.path);
      certificationUrls.push(uploaded.url);
    }
  }

  // Create subcontractor user
  const user = await User.create({
    role: "subcontractor",
    subcontractorProfile: {
      fullName,
      primaryTrade,
      yearsExperience,
      email,
      postcode,
      phoneNumber,
      password: hashedPassword,
      profilePhoto: profilePhotoUrl,
      workExamples: workExampleUrls,
      certifications: certificationUrls,
      dayRate,
      availability,
      professionalBio,
      rating: 0,
      totalReviews: 0,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Subcontractor registered successfully"));
});


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find user in both company + subcontractor profiles
  const user = await User.findOne({
    $or: [
      { "companyProfile.workEmail": email },
      { "subcontractorProfile.email": email }
    ]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Detect password source
  let hashedPassword =
    user.role === "company"
      ? user.companyProfile.password
      : user.subcontractorProfile.password;

  // Check password
  const isMatch = await bcrypt.compare(password, hashedPassword);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json(
    new ApiResponse(200, { user, token }, "Login successful")
  );
});
