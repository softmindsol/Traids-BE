// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const isDocument = /\.(pdf|docx?|xlsx?|txt)$/i.test(localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: isDocument ? "raw" : "auto",
      // folder: "documents",
      access_mode: "public",
    });

    fs.unlinkSync(localFilePath);

    // ✅ Use the secure_url directly - Cloudinary handles this correctly
    return { ...response, url: response.secure_url };
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    // ✅ Specify resource_type for raw files
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });
    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion error:", error.message);
  }
};
