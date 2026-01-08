import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  brand: {
    type: String,
    required: true,
    index: true
  },
  priceINR: {
    type: Number,
    required: true
  },
  priceAED: {
    type: Number,
    required: true
  },
  description: {
    type: String,
  },
  images: {
    image1: { type: String, required: true },
    image2: { type: String },
    image3: { type: String },
    image4: { type: String }
  },
  videos: {
    video1: { type: String },
    video2: { type: String }
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'subcategory',
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
    index: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  trending: {
    type: Boolean,
    default: false,
    index: true
  },
  type: {
    type: String,
    index: true
  }
}, { 
  timestamps: true 
});

// Compound indexes for common queries
ProductSchema.index({ seller: 1, trending: 1 });
ProductSchema.index({ categoryId: 1, active: 1 });
ProductSchema.index({ subCategoryId: 1, active: 1 });
ProductSchema.index({ trending: 1, active: 1, createdAt: -1 });

const productModel = mongoose.model('Product', ProductSchema);

// Create indexes
productModel.createIndexes();

export default productModel;