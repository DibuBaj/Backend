import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, oldPublicId = null) => {
  try {
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (deleteError) {
        console.error("Error deleting  image on Cloudinary:", deleteError);
      }
    }

    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    if (!response || !response.secure_url) {
      console.error("Invalid Cloudinary Response:", response);
      return null;
    }

    
    try {
      fs.unlinkSync(localFilePath);
    } catch (fsError) {
      console.error("Error deleting local file:", fsError);
    }

    return response;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    try {
      fs.unlinkSync(localFilePath);
    } catch (fsError) {
      console.error("Error deleting local file after upload failure:", fsError);
    }

    return null;
  }
};

export { uploadOnCloudinary };
