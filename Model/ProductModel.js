import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    default: ''  // Make brand optional with default
  },
  priceINR: {
    type: Number,
    required: true,
    min: 0
  },
  priceAED: {
    type: Number,
    min: 0,
    default: 0  // Make priceAED optional with default
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  shortDescription: {
    type: String,
    maxlength: 200,
    trim: true,
    default: ''
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,  // Keep sparse to allow multiple nulls
    trim: true,
    default: null  // Allow auto-generation
  },
  stock: {
    type: Number,
    default: 0,  // Default to 0 instead of required
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  weight: {
    value: {
      type: Number,
      min: 0,
      default: 0
    },
    unit: {
      type: String,
      enum: ['g', 'kg', 'lb', 'oz'],
      default: 'g'
    }
  },
  dimensions: {
    length: {
      type: Number,
      min: 0,
      default: 0
    },
    width: {
      type: Number,
      min: 0,
      default: 0
    },
    height: {
      type: Number,
      min: 0,
      default: 0
    },
    unit: {
      type: String,
      enum: ['cm', 'inch', 'mm'],
      default: 'cm'
    }
  },
  colors: [{
    type: String,
    trim: true,
    default: []
  }],
  sizes: [{
    type: String,
    trim: true,
    default: []
  }],
  material: {
    type: String,
    trim: true,
    default: ''
  },
  warranty: {
    period: {
      type: Number,
      min: 0,
      default: 0
    },
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  tags: [{
    type: String,
    trim: true,
    index: true,
    default: []
  }],
  images: {
    image1: { type: String, required: true },  // Keep this required - ensures at least one image
    image2: { type: String, default: '' },
    image3: { type: String, default: '' },
    image4: { type: String, default: '' }
  },
  videos: {
    video1: { type: String, default: '' },
    video2: { type: String, default: '' }
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'subcategory',
    index: true,
    required: true  // Keep required
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,  // Keep required
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,  // Keep required
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
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    amount: {
      type: Number,
      min: 0,
      default: 0
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  soldCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    index: true,
    trim: true,
    default: ''
  },
  shippingInfo: {
    weightBased: {
      type: Boolean,
      default: false
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    processingTime: {
      type: Number,
      default: 1,
      min: 0
    },
    processingUnit: {
      type: String,
      enum: ['hours', 'days'],
      default: 'days'
    }
  },
  metaTitle: {
    type: String,
    trim: true,
    default: ''
  },
  metaDescription: {
    type: String,
    trim: true,
    default: ''
  },
  metaKeywords: [{
    type: String,
    trim: true,
    default: []
  }]
}, { 
  timestamps: true 
});

// Indexes remain the same
ProductSchema.index({ seller: 1, trending: 1 });
ProductSchema.index({ categoryId: 1, active: 1 });
ProductSchema.index({ subCategoryId: 1, active: 1 });
ProductSchema.index({ trending: 1, active: 1, createdAt: -1 });
ProductSchema.index({ stock: 1, active: 1 });
ProductSchema.index({ 'discount.percentage': 1, active: 1 });
ProductSchema.index({ name: 'text', brand: 'text', description: 'text', shortDescription: 'text' });

const productModel = mongoose.model('Product', ProductSchema);

export default productModel;