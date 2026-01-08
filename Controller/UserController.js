import categoryModel from "../Model/CategoryModel.js"
import productModel from "../Model/ProductModel.js"
import SellerModel from "../Model/SellerModel.js";
import subcategoryModel from "../Model/SubCategoryModel.js";
import mongoose from "mongoose";

export const getProduct = async(req,res)=>{
    try {
        const { page = 1, limit = 20, search = '', category, subcategory, seller } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let query = { active: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category && mongoose.Types.ObjectId.isValid(category)) {
            query.categoryId = new mongoose.Types.ObjectId(category);
        }
        
        if (subcategory && mongoose.Types.ObjectId.isValid(subcategory)) {
            query.subCategoryId = new mongoose.Types.ObjectId(subcategory);
        }
        
        if (seller && mongoose.Types.ObjectId.isValid(seller)) {
            query.seller = new mongoose.Types.ObjectId(seller);
        }
        
        const total = await productModel.countDocuments(query);
        const products = await productModel.find(query)
            .populate('categoryId', 'name')
            .populate('subCategoryId', 'name')
            .populate('seller', 'name image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        if(!products || products.length === 0){
            return res.status(404).json({ 
                message: "No products found",
                products: [],
                total: 0,
                page: parseInt(page),
                totalPages: 0
            });
        }
        
        res.status(200).json({
            products,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({message:"Internal server error"})
    }
}

export const getCategory = async(req,res)=>{
    try {
        const {id} = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid seller ID format" });
        }

        const seller = await SellerModel.findById(id).select('categories');
        
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        if (!seller.categories || seller.categories.length === 0) {
            return res.status(404).json({ 
                message: "No categories assigned to this seller",
                categories: []
            });
        }

        const category = await categoryModel.find({
            _id: { $in: seller.categories },
            active: true
        }).select('name image description');

        if (!category || category.length === 0) {
            return res.status(404).json({ 
                message: "No active categories found",
                categories: []
            });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error("Get category error:", error);
        res.status(500).json({message:"Internal server error"})
    }
}

export const getSubCategories = async(req,res)=>{
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid category ID format" });
        }

        const category = await subcategoryModel.find({
            categoryId: id,
            active: true
        }).select('name image description').sort({ name: 1 });

        if (!category || category.length === 0) {
            return res.status(404).json({ 
                message: "No subcategories found for this category",
                subcategories: []
            });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error("Get subcategories error:", error);
        res.status(500).json({message:"Internal server error"})
    }
}

export const getDetails = async(req,res)=>{
    try {
        const {id} = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID format" });
        }

        const product = await productModel.findById(id)
            .populate('subCategoryId', 'name image')
            .populate('categoryId', 'name')
            .populate('seller', 'name image address contact email');

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error("Get details error:", error);
        res.status(500).json({message:"Internal server error"})
    }
}

export const getSubCategory = async (req, res) => {
    try {
        const sellerId = req.params.id;
        const categoryId = req.params.category;
        
        if (!mongoose.Types.ObjectId.isValid(sellerId) || 
            !mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ 
                message: "Invalid seller or category ID format" 
            });
        }

        const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
        const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

        const subcategories = await productModel.aggregate([
            {
                $match: {
                    seller: sellerObjectId,
                    categoryId: categoryObjectId,
                    active: true
                }
            },
            {
                $group: {
                    _id: "$subCategoryId",
                    productCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "subcategoryInfo"
                }
            },
            {
                $unwind: "$subcategoryInfo"
            },
            {
                $match: {
                    "subcategoryInfo.active": true
                }
            },
            {
                $project: {
                    _id: "$subcategoryInfo._id",
                    name: "$subcategoryInfo.name",
                    image: "$subcategoryInfo.image",
                    description: "$subcategoryInfo.description",
                    itemCount: "$productCount"
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        if (!subcategories.length) {
            return res.status(404).json({ 
                message: "No active subcategories found for this seller and category",
                subcategories: []
            });
        }

        res.status(200).json(subcategories);
    } catch (error) {
        console.error("Get subcategory error:", error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
}

export const ProductType = async(req,res)=>{
    try {
        const {id} = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid subcategory ID format" });
        }

        const types = await productModel.aggregate([
            {
                $match: {
                    subCategoryId: new mongoose.Types.ObjectId(id),
                    active: true,
                    type: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: "$_id",
                    count: 1
                }
            },
            {
                $sort: { type: 1 }
            }
        ]);

        if (!types.length) {
            return res.status(404).json({ 
                message: "No product types found for this subcategory",
                types: []
            });
        }

        res.status(200).json(types);
    } catch (error) {
        console.error("Product type error:", error);
        res.status(500).json({message:"Internal server error"})
    }
}

export const relatedProduct = async (req, res) => {
    try {
        const subCategoryId = req.params.category;
        const sellerId = req.params.seller;
        
        if (!mongoose.Types.ObjectId.isValid(subCategoryId) || 
            !mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ 
                message: "Invalid subcategory or seller ID format" 
            });
        }

        const subCategoryObjectId = new mongoose.Types.ObjectId(subCategoryId);
        const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
        
        const products = await productModel.find({ 
            subCategoryId: subCategoryObjectId,
            seller: sellerObjectId,
            active: true 
        })
        .populate("subCategoryId", "name image")
        .populate("categoryId", "name")
        .populate("seller", "name image")
        .limit(10)
        .sort({ createdAt: -1 });
        
        if (!products.length) {
            return res.status(404).json({ 
                message: "No related products found",
                products: []
            });
        }
        
        res.status(200).json(products);
    } catch (error) {
        console.error("Related products error:", error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

export const getSellers = async(req,res)=>{
    try {
        const sellers = await SellerModel.find({ active: true })
            .select('name image description address contact email')
            .sort({ name: 1 });

        if (!sellers.length) {
            return res.status(404).json({ 
                message: "No active sellers found",
                sellers: []
            });
        }

        res.status(200).json(sellers);
    } catch (error) {
        console.error("Get sellers error:", error);
        res.status(500).json({message:"internal server error"})
    }
}

export const getProductsByType = async(req,res)=>{
    try {
        const { type, subCategoryId, sellerId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let query = { 
            active: true,
            type: type 
        };
        
        if (mongoose.Types.ObjectId.isValid(subCategoryId)) {
            query.subCategoryId = new mongoose.Types.ObjectId(subCategoryId);
        }
        
        if (mongoose.Types.ObjectId.isValid(sellerId)) {
            query.seller = new mongoose.Types.ObjectId(sellerId);
        }
        
        const total = await productModel.countDocuments(query);
        const products = await productModel.find(query)
            .populate('subCategoryId', 'name image')
            .populate('categoryId', 'name')
            .populate('seller', 'name image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        if(!products.length){
            return res.status(404).json({ 
                message: "No products found for this type",
                products: [],
                total: 0,
                page: parseInt(page),
                totalPages: 0
            });
        }
        
        res.status(200).json({
            products,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error("Get products by type error:", error);
        res.status(500).json({message:"Internal server error"})
    }
}

export const getProductsBySeller = async(req,res)=>{
    try {
        const { sellerId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ message: "Invalid seller ID format" });
        }
        
        const query = { 
            seller: new mongoose.Types.ObjectId(sellerId),
            active: true 
        };
        
        const total = await productModel.countDocuments(query);
        const products = await productModel.find(query)
            .populate('subCategoryId', 'name image')
            .populate('categoryId', 'name')
            .populate('seller', 'name image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        if(!products.length){
            return res.status(404).json({ 
                message: "No products found for this seller",
                products: [],
                total: 0,
                page: parseInt(page),
                totalPages: 0
            });
        }
        
        res.status(200).json({
            products,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error("Get products by seller error:", error);
        res.status(500).json({message:"Internal server error"})
    }
}