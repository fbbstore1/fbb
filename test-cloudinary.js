import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.uploader.upload(
  "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  { folder: "product-fbb/test" },
  (err, result) => {
    if (err) {
      console.error("UPLOAD FAILED:", err);
    } else {
      console.log("UPLOAD SUCCESS:", result.secure_url);
    }
  }
);