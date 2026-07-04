import SellerModel from "../Model/SellerModel.js"
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import productModel from "../Model/ProductModel.js";
import categoryModel from "../Model/CategoryModel.js";
import OrderModel from "../Model/OrderModel.js";

export const SignUp = async (req, res) => {
  try {
    const { email, phone, password, name, companyName, address, city, state, country, pincode, gstNumber, panNumber } = req.body

    if (!email || !phone || !password || !name) {
      return res.status(400).json({ message: "Name, email, phone and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existing = await SellerModel.findOne({ $or: [{ email }, { phone }] })

    if (existing) {
      return res.status(400).json({ message: "Email or phone already exists" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedpass = await bcrypt.hash(password, salt)

    const seller = new SellerModel({
      name,
      email,
      phone,
      companyName,
      address,
      city,
      state,
      country,
      pincode,
      gstNumber,
      panNumber,
      password: hashedpass
    })

    await seller.save()

    const token = jwt.sign({ userId: seller._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}

export const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "Email/Phone and password are required" });
    }

    const seller = await SellerModel.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!seller) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: seller._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        companyName: seller.companyName,
        _id: seller._id,
        status: seller.status,
        profileImage: seller.profileImage
      }
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addProduct = async (req, res) => {
  try {
    const sellerId = req.user?.userId;

    const {
      name, brand, priceINR, priceAED, categoryId, subCategoryId,
      description, shortDescription, sku, stock, lowStockThreshold, material,
      colors, sizes, tags, weightValue, weightUnit, length, width, height,
      dimensionUnit, warrantyPeriod, warrantyUnit, warrantyDescription,
      isTrending, isFeatured, discountPercentage, discountAmount,
      discountStartDate, discountEndDate, weightBasedShipping, freeShipping,
      shippingCost, metaTitle, metaDescription, metaKeywords, specifications
    } = req.body;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required"
      });
    }

    if (!priceINR || parseFloat(priceINR) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price (INR) is required"
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }

    if (!subCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Sub-category is required"
      });
    }

    const categoryExists = await categoryModel.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    let finalSku = sku;
    if (!finalSku || finalSku.trim() === '') {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      finalSku = `SKU_${timestamp}_${random}`;
    } else {
      const existingSku = await productModel.findOne({ sku: finalSku });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists"
        });
      }
    }

    const images = {};
    const videos = {};

    let hasImage = false;
    if (req.files) {
      for (let i = 1; i <= 4; i++) {
        const fieldName = `image${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          images[fieldName] = req.files[fieldName][0].path;
          hasImage = true;
        }
      }

      for (let i = 1; i <= 4; i++) {
        const fieldName = `video${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          videos[fieldName] = req.files[fieldName][0].path;
        }
      }
    }

    if (!hasImage) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }

    if (!images.image1) {
      return res.status(400).json({
        success: false,
        message: "Main product image is required"
      });
    }

    let parsedSpecifications = {};
    try {
      if (specifications && typeof specifications === 'string') {
        const specArray = JSON.parse(specifications);
        if (Array.isArray(specArray)) {
          specArray.forEach(spec => {
            if (spec.key && spec.key.trim() && spec.value && spec.value.trim()) {
              parsedSpecifications[spec.key.trim()] = spec.value.trim();
            }
          });
        }
      } else if (specifications && typeof specifications === 'object') {
        parsedSpecifications = specifications;
      }
    } catch (error) {
      parsedSpecifications = {};
    }

    const colorsArray = colors && colors.trim() ? colors.split(',').map(c => c.trim()).filter(c => c) : [];
    const sizesArray = sizes && sizes.trim() ? sizes.split(',').map(s => s.trim()).filter(s => s) : [];
    const tagsArray = tags && tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const metaKeywordsArray = metaKeywords && metaKeywords.trim() ? metaKeywords.split(',').map(k => k.trim()).filter(k => k) : [];

    const productData = {
      name: name.trim(),
      brand: brand && brand.trim() ? brand.trim() : '',
      priceINR: parseFloat(priceINR),
      priceAED: priceAED && parseFloat(priceAED) ? parseFloat(priceAED) : 0,
      description: description || '',
      shortDescription: shortDescription || '',
      sku: finalSku,
      stock: stock && !isNaN(parseInt(stock)) ? parseInt(stock) : 0,
      lowStockThreshold: lowStockThreshold && !isNaN(parseInt(lowStockThreshold)) ? parseInt(lowStockThreshold) : 10,
      images,
      videos,
      subCategoryId,
      categoryId,
      seller: sellerId,
      material: material || '',
      colors: colorsArray,
      sizes: sizesArray,
      tags: tagsArray,
      specifications: parsedSpecifications,
      trending: isTrending === 'true' || isTrending === true,
      featured: isFeatured === 'true' || isFeatured === true,
    };

    if (weightValue && parseFloat(weightValue) > 0) {
      productData.weight = {
        value: parseFloat(weightValue),
        unit: weightUnit || 'g'
      };
    }

    if (length || width || height) {
      productData.dimensions = {
        length: length && parseFloat(length) ? parseFloat(length) : 0,
        width: width && parseFloat(width) ? parseFloat(width) : 0,
        height: height && parseFloat(height) ? parseFloat(height) : 0,
        unit: dimensionUnit || 'cm'
      };
    }

    if (warrantyPeriod && parseInt(warrantyPeriod) > 0) {
      productData.warranty = {
        period: parseInt(warrantyPeriod),
        unit: warrantyUnit || 'months',
        description: warrantyDescription || ''
      };
    }

    if ((discountPercentage && parseFloat(discountPercentage) > 0) || (discountAmount && parseFloat(discountAmount) > 0)) {
      productData.discount = {
        percentage: discountPercentage ? parseFloat(discountPercentage) : 0,
        amount: discountAmount ? parseFloat(discountAmount) : 0,
        startDate: discountStartDate || null,
        endDate: discountEndDate || null
      };
    }

    productData.shippingInfo = {
      weightBased: weightBasedShipping === 'true' || weightBasedShipping === true,
      freeShipping: freeShipping === 'true' || freeShipping === true,
      shippingCost: shippingCost && parseFloat(shippingCost) ? parseFloat(shippingCost) : 0
    };

    if (metaTitle && metaTitle.trim()) {
      productData.metaTitle = metaTitle.trim();
    }
    if (metaDescription && metaDescription.trim()) {
      productData.metaDescription = metaDescription.trim();
    }
    if (metaKeywordsArray.length > 0) {
      productData.metaKeywords = metaKeywordsArray;
    }

    const product = await productModel.create(productData);

    await SellerModel.findByIdAndUpdate(product.seller, {
      $addToSet: { categories: productData.categoryId }
    });

    const populatedProduct = await productModel.findById(product._id)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name');

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: populatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const seller = req.params.id
    const products = await productModel
      .find({ seller: seller })
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const seller = await SellerModel.findById(userId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    seller.password = hashedNewPassword;
    await seller.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {

    console.log("Reach 3")
    const { id } = req.params;
    const sellerId = req.user?.userId;

    const {
      name, brand, categoryId, subCategoryId, priceINR, priceAED, isTrending,
      existingImages, existingVideos, description, shortDescription, sku, stock,
      lowStockThreshold, material, colors, sizes, tags, weightValue, weightUnit,
      length, width, height, dimensionUnit, warrantyPeriod, warrantyUnit,
      warrantyDescription, isFeatured, discountPercentage, discountAmount,
      discountStartDate, discountEndDate, weightBasedShipping, freeShipping,
      shippingCost, metaTitle, metaDescription, metaKeywords, specifications
    } = req.body;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!sellerId || product.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this product"
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required"
      });
    }

    if (!priceINR || parseFloat(priceINR) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price (INR) is required"
      });
    }

    let parsedExistingImages = {};
    try {
      if (existingImages && typeof existingImages === 'string') {
        const parsed = JSON.parse(existingImages);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedExistingImages = parsed;
        }
      }
    } catch (error) {
      parsedExistingImages = {};
    }

    let parsedExistingVideos = {};
    try {
      if (existingVideos && typeof existingVideos === 'string') {
        const parsed = JSON.parse(existingVideos);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedExistingVideos = parsed;
        }
      }
    } catch (error) {
      parsedExistingVideos = {};
    }

    const newImages = {};
    const newVideos = {};

    if (req.files) {
      for (let i = 1; i <= 4; i++) {
        const fieldName = `image${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          newImages[fieldName] = req.files[fieldName][0].path;
        }
      }

      for (let i = 1; i <= 4; i++) {
        const fieldName = `video${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          newVideos[fieldName] = req.files[fieldName][0].path;
        }
      }
    }

    const finalImages = {};
    let hasImage = false;
    for (let i = 1; i <= 4; i++) {
      const fieldName = `image${i}`;
      const newImage = newImages[fieldName];
      const existingImage = parsedExistingImages[fieldName];
      const currentImage = product.images && product.images[fieldName];

      if (newImage) {
        finalImages[fieldName] = newImage;
        hasImage = true;
      } else if (existingImage) {
        finalImages[fieldName] = existingImage;
        hasImage = true;
      } else if (currentImage) {
        finalImages[fieldName] = currentImage;
        hasImage = true;
      }
    }

    if (!hasImage) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }

    const finalVideos = {};
    for (let i = 1; i <= 2; i++) {
      const fieldName = `video${i}`;
      const newVideo = newVideos[fieldName];
      const existingVideo = parsedExistingVideos[fieldName];
      const currentVideo = product.videos && product.videos[fieldName];

      if (newVideo) {
        finalVideos[fieldName] = newVideo;
      } else if (existingVideo) {
        finalVideos[fieldName] = existingVideo;
      } else if (currentVideo) {
        finalVideos[fieldName] = currentVideo;
      }
    }

    let parsedSpecifications = {};
    try {
      if (specifications && typeof specifications === 'string') {
        const specArray = JSON.parse(specifications);
        if (Array.isArray(specArray)) {
          specArray.forEach(spec => {
            if (spec.key && spec.key.trim() && spec.value && spec.value.trim()) {
              parsedSpecifications[spec.key.trim()] = spec.value.trim();
            }
          });
        }
      } else if (specifications && typeof specifications === 'object') {
        parsedSpecifications = specifications;
      } else {
        parsedSpecifications = product.specifications || {};
      }
    } catch (error) {
      parsedSpecifications = product.specifications || {};
    }

    const colorsArray = colors && colors.trim() ? colors.split(',').map(c => c.trim()).filter(c => c) : product.colors || [];
    const sizesArray = sizes && sizes.trim() ? sizes.split(',').map(s => s.trim()).filter(s => s) : product.sizes || [];
    const tagsArray = tags && tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : product.tags || [];
    const metaKeywordsArray = metaKeywords && metaKeywords.trim() ? metaKeywords.split(',').map(k => k.trim()).filter(k => k) : product.metaKeywords || [];

    const updateData = {
      name: name.trim(),
      brand: brand && brand.trim() ? brand.trim() : '',
      categoryId,
      subCategoryId,
      priceINR: parseFloat(priceINR),
      priceAED: priceAED && parseFloat(priceAED) ? parseFloat(priceAED) : 0,
      description: description || '',
      shortDescription: shortDescription || '',
      sku: sku || product.sku,
      stock: stock && !isNaN(parseInt(stock)) ? parseInt(stock) : 0,
      lowStockThreshold: lowStockThreshold && !isNaN(parseInt(lowStockThreshold)) ? parseInt(lowStockThreshold) : 10,
      images: finalImages,
      videos: finalVideos,
      trending: isTrending === 'true' || isTrending === true,
      featured: isFeatured === 'true' || isFeatured === true,
      material: material || '',
      colors: colorsArray,
      sizes: sizesArray,
      tags: tagsArray,
      specifications: parsedSpecifications,
    };

    if (weightValue && parseFloat(weightValue) > 0) {
      updateData.weight = {
        value: parseFloat(weightValue),
        unit: weightUnit || 'g'
      };
    } else if (product.weight && product.weight.value > 0) {
      updateData.weight = product.weight;
    }

    if (length || width || height) {
      updateData.dimensions = {
        length: length && parseFloat(length) ? parseFloat(length) : 0,
        width: width && parseFloat(width) ? parseFloat(width) : 0,
        height: height && parseFloat(height) ? parseFloat(height) : 0,
        unit: dimensionUnit || 'cm'
      };
    } else if (product.dimensions) {
      updateData.dimensions = product.dimensions;
    }

    if (warrantyPeriod && parseInt(warrantyPeriod) > 0) {
      updateData.warranty = {
        period: parseInt(warrantyPeriod),
        unit: warrantyUnit || 'months',
        description: warrantyDescription || ''
      };
    } else if (product.warranty && product.warranty.period > 0) {
      updateData.warranty = product.warranty;
    }

    if ((discountPercentage && parseFloat(discountPercentage) > 0) || (discountAmount && parseFloat(discountAmount) > 0)) {
      updateData.discount = {
        percentage: discountPercentage ? parseFloat(discountPercentage) : 0,
        amount: discountAmount ? parseFloat(discountAmount) : 0,
        startDate: discountStartDate || null,
        endDate: discountEndDate || null
      };
    } else if (product.discount && (product.discount.percentage > 0 || product.discount.amount > 0)) {
      updateData.discount = product.discount;
    }

    updateData.shippingInfo = {
      weightBased: weightBasedShipping === 'true' || weightBasedShipping === true,
      freeShipping: freeShipping === 'true' || freeShipping === true,
      shippingCost: shippingCost && parseFloat(shippingCost) ? parseFloat(shippingCost) : 0
    };

    if (metaTitle && metaTitle.trim()) {
      updateData.metaTitle = metaTitle.trim();
    }
    if (metaDescription && metaDescription.trim()) {
      updateData.metaDescription = metaDescription.trim();
    }
    if (metaKeywordsArray.length > 0) {
      updateData.metaKeywords = metaKeywordsArray;
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('categoryId')
      .populate('subCategoryId')
      .populate('seller', 'name email');

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const sellerId = req.user?.userId;
    const { INR, DXB, name, phone, companyName, address, city, state, country, pincode, gstNumber, panNumber } = req.body;

    if (!sellerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const image = req.file?.path;

    const updateFields = {};
    if (INR) updateFields.INR = INR;
    if (DXB) updateFields.DXB = DXB;
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (companyName) updateFields.companyName = companyName;
    if (address) updateFields.address = address;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (country) updateFields.country = country;
    if (pincode) updateFields.pincode = pincode;
    if (gstNumber) updateFields.gstNumber = gstNumber;
    if (panNumber) updateFields.panNumber = panNumber;
    if (image) updateFields.profileImage = image;

    const updatedSeller = await SellerModel.findByIdAndUpdate(
      sellerId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedSeller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const sellerId = req.user?.userId;

    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!sellerId || product.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product"
      });
    }

    await productModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });
  }
}

export const getSellerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await SellerModel.findById(id)
      .select('-password')
      .populate('categories', 'name');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller profile",
      error: error.message
    });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user?.userId;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required"
      });
    }

    const orders = await OrderModel.find({
      "sellerOrders.seller": sellerId
    })
      .populate('user', 'name email phone address')
      .populate({
        path: 'items.product',
        select: 'name brand images'
      })
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => {
      const sellerOrder = order.sellerOrders.find(so =>
        so.seller.toString() === sellerId.toString()
      );

      return {
        orderId: order.orderId,
        createdAt: order.createdAt,
        orderDate: order.createdAt,
        user: order.user,
        items: order.items.filter(item =>
          item.seller.toString() === sellerId.toString()
        ),
        subtotal: sellerOrder?.subtotal || 0,
        shipping: sellerOrder?.shipping || 0,
        tax: sellerOrder?.tax || 0,
        total: sellerOrder?.total || 0,
        sellerStatus: sellerOrder?.sellerStatus || 'pending',
        status: order.status,
        trackingNumber: sellerOrder?.trackingNumber,
        shippedAt: sellerOrder?.shippedAt,
        orderStatus: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress || null,
        billingAddress: order.billingAddress || null,
        sellerOrder: {
          subtotal: sellerOrder?.subtotal || 0,
          shipping: sellerOrder?.shipping || 0,
          tax: sellerOrder?.tax || 0,
          total: sellerOrder?.total || 0,
          trackingNumber: sellerOrder?.trackingNumber,
          shippedAt: sellerOrder?.shippedAt,
          sellerStatus: sellerOrder?.sellerStatus || 'pending'
        }
      };
    });

    res.status(200).json({
      success: true,
      orders: formattedOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get seller orders",
      error: error.message
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, trackingNumber } = req.body;
    const sellerId = req.user?.userId;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required"
      });
    }

    const order = await OrderModel.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const validStatuses = ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${validStatuses.join(', ')}`
      });
    }

    let sellerOrder = order.sellerOrders.find(so =>
      so.seller.toString() === sellerId.toString()
    );

    if (!sellerOrder) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this order"
      });
    }

    sellerOrder.sellerStatus = status;

    if (status === 'shipped' && trackingNumber) {
      sellerOrder.trackingNumber = trackingNumber;
      sellerOrder.shippedAt = new Date();
    }

    order.items.forEach(item => {
      if (item.seller && item.seller.toString() === sellerId.toString()) {
        if (status === 'shipped') {
          item.itemStatus = 'shipped';
          if (trackingNumber) {
            item.trackingNumber = trackingNumber;
          }
        } else if (status === 'accepted') {
          item.sellerStatus = 'accepted';
        } else if (status === 'processing') {
          item.itemStatus = 'processing';
          item.sellerStatus = 'processing';
        } else if (status === 'delivered') {
          item.itemStatus = 'delivered';
        } else if (status === 'cancelled') {
          item.itemStatus = 'cancelled';
          item.sellerStatus = 'cancelled';
        }
      }
    });

    const allItemsDelivered = order.items.every(item =>
      item.itemStatus === 'delivered' ||
      (item.seller && item.seller.toString() !== sellerId.toString())
    );

    if (allItemsDelivered && status === 'delivered') {
      order.status = 'delivered';
    }

    const allItemsShipped = order.items.every(item =>
      item.itemStatus === 'shipped' || item.itemStatus === 'delivered' ||
      (item.seller && item.seller.toString() !== sellerId.toString())
    );

    if (allItemsShipped && status === 'shipped') {
      order.status = 'partially_shipped';
      const allSellersShipped = order.sellerOrders.every(so =>
        so.sellerStatus === 'shipped' || so.sellerStatus === 'delivered'
      );
      if (allSellersShipped) {
        order.status = 'shipped';
      }
    }

    await order.save();

    const updatedOrder = await OrderModel.findOne({ orderId })
      .populate('user', 'name email phone')
      .populate('items.product', 'name brand images');

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
};

export const getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user?.userId;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required"
      });
    }

    const totalProducts = await productModel.countDocuments({
      seller: sellerId,
      active: true
    });

    const orders = await OrderModel.find({
      "sellerOrders.seller": sellerId
    });

    const totalOrders = orders.length;

    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;

    orders.forEach(order => {
      const sellerOrder = order.sellerOrders.find(so =>
        so.seller.toString() === sellerId.toString()
      );

      if (sellerOrder) {
        totalRevenue += sellerOrder.total;

        if (sellerOrder.sellerStatus === 'completed' || sellerOrder.sellerStatus === 'delivered') {
          completedOrders++;
        } else if (sellerOrder.sellerStatus === 'pending' || sellerOrder.sellerStatus === 'processing') {
          pendingOrders++;
        }
      }
    });

    const stats = {
      totalProducts,
      totalOrders,
      totalSales: totalRevenue,
      pendingOrders,
      completedOrders
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: error.message
    });
  }
};

export default {
  SignUp,
  login,
  addProduct,
  getProducts,
  resetPassword,
  updateProduct,
  updateProfile,
  deleteProduct,
  getSellerProfile,
  getSellerOrders,
  updateOrderStatus,
  getSellerDashboardStats
};