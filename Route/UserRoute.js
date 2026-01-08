import express from "express";
const UserRoute = express.Router();
import dotenv from 'dotenv';
import { 
    ProductType, 
    getCategory, 
    getDetails, 
    getProduct, 
    getSellers, 
    getSubCategories, 
    getSubCategory, 
    relatedProduct,
    getProductsByType,
    getProductsBySeller,
    clearCacheHandler
} from "../Controller/UserController.js";

dotenv.config();

UserRoute.get("/products", getProduct);
UserRoute.get("/products/:id", getDetails);
UserRoute.get("/products/type/:type/:subCategoryId?/:sellerId?", getProductsByType);
UserRoute.get("/products/seller/:sellerId", getProductsBySeller);
UserRoute.get("/products/related/:seller/:category", relatedProduct);

UserRoute.get("/categories/:id", getCategory);
UserRoute.get("/subcategories/:id", getSubCategories);
UserRoute.get("/subcategory/:id/:category", getSubCategory);
UserRoute.get("/types/:id", ProductType);

UserRoute.get("/sellers", getSellers);

UserRoute.get("/clear-cache", clearCacheHandler);

UserRoute.get("/get-product", getProduct);
UserRoute.get("/get-category/:id", getCategory);
UserRoute.get("/get-subcategories/:id", getSubCategories);
UserRoute.get("/get-product/:id", getDetails);
UserRoute.get("/get-subcategory/:id/:category", getSubCategory);
UserRoute.get("/get-type/:id", ProductType);
UserRoute.get("/get-related/:seller/:category", relatedProduct);
UserRoute.get("/get-sellers", getSellers);

export default UserRoute;