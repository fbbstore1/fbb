import express from "express";
import { addCategory, getCategory, addSubcategory, getSubCategory, updateTrending, SignUp, login, editCategory, getSellers, updateStatus, getSellerProduct, sellerByid, getProducts, editSubcategory } from "../Controller/AdminController.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from 'dotenv';

dotenv.config();

const adminRouter = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "category-fbb",
    resource_type: "auto",
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const categoryUpload = multer({ storage: categoryStorage });

const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product-fbb",
    resource_type: "auto",
    public_id: (req, file) => `${Date.now()}-${file.fieldname}-${file.originalname}`,
  },
});

const productUpload = multer({ storage: productStorage });

adminRouter.post("/add-category", categoryUpload.single('image'), addCategory);
adminRouter.get("/get-category", getCategory);
adminRouter.post("/add-subcategory", categoryUpload.single('image'), addSubcategory);
adminRouter.get("/get-subcategory", getSubCategory);

// adminRouter.post("/add-product", productUpload.fields([
//   { name: 'image1', maxCount: 1 },
//   { name: 'image2', maxCount: 1 },
//   { name: 'image3', maxCount: 1 },
//   { name: 'image4', maxCount: 1 }
// ]), addProduct);

adminRouter.put("/update-trending/:id", updateTrending);

// adminRouter.put("/edit-product/:id", handleProductImages, updateProduct);
adminRouter.post("/register",SignUp)
adminRouter.post("/login",login)
adminRouter.put("/edit-category",categoryUpload.single('image'),editCategory)
adminRouter.put("/edit-subcategory/:id",categoryUpload.single('image'),editSubcategory)
adminRouter.get("/get-sellers",getSellers)
adminRouter.put("/update-status/:id",updateStatus)
adminRouter.get("/get-products/:id",getSellerProduct)
adminRouter.get("/get-seller/:id",sellerByid)
adminRouter.get("/get-products",getProducts)

export default adminRouter;