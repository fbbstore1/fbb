import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import SellerModel from "../Model/SellerModel.js";
import { 
  SignUp, 
  addProduct, 
  deleteProduct, 
  getProducts, 
  login, 
  resetPassword, 
  updateProduct, 
  updateProfile,
  getSellerOrders,
  updateOrderStatus,
  getSellerDashboardStats,
  getSellerProfile
} from "../Controller/SellerController.js";
import { getSalesReport } from "../Controller/OrderController.js";

dotenv.config();

const SellerRouter = express.Router();

const sellerAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const seller = await SellerModel.findById(decoded.userId);
    if (!seller) {
      return res.status(401).json({ success: false, message: "Seller not found" });
    }
    req.user = { userId: decoded.userId };
    req.seller = seller;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product-fbb/profiles",
    resource_type: "auto",
    public_id: (req, file) => `profile-${Date.now()}-${file.originalname}`,
  },
});

const profileImageUpload = multer({ storage: profileImageStorage });

const mediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product-fbb/products",
    resource_type: "auto",
    public_id: (req, file) => `${Date.now()}-${file.fieldname}-${file.originalname}`,
  },
});

const mediaUpload = multer({ storage: mediaStorage });

const handleProductMedia = async (req, res, next) => {
  try {
    const mediaFields = [
      { name: 'image1', maxCount: 1 },
      { name: 'image2', maxCount: 1 },
      { name: 'image3', maxCount: 1 },
      { name: 'image4', maxCount: 1 },
      { name: 'video1', maxCount: 1 },
      { name: 'video2', maxCount: 1 }
    ];
    return mediaUpload.fields(mediaFields)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: `Error uploading files: ${err.message}` });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

SellerRouter.post("/register", SignUp);
SellerRouter.post("/login", login);
SellerRouter.post('/reset-password/:userId', resetPassword);

SellerRouter.get('/profile/:id', getSellerProfile);
SellerRouter.put('/update-profile/:userId', profileImageUpload.single('profileImage'), updateProfile);

SellerRouter.post("/add-product", handleProductMedia, addProduct);
SellerRouter.get("/get-products/:id", getProducts);
SellerRouter.put("/edit-product/:id", handleProductMedia, updateProduct);
SellerRouter.delete("/delete-product/:id", deleteProduct);

SellerRouter.get("/orders", sellerAuthMiddleware, getSellerOrders);
SellerRouter.post("/orders/update-status", sellerAuthMiddleware, updateOrderStatus);
SellerRouter.get("/dashboard/stats", sellerAuthMiddleware, getSellerDashboardStats);
SellerRouter.get("/sales-report", sellerAuthMiddleware, getSalesReport)

export default SellerRouter;