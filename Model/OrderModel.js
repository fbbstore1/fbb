import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    selectedColor: String,
    selectedSize: String,
    itemStatus: {
      type: String,
      enum: ["pending", "accepted", "processing", "packed", "shipped", "delivered", "cancelled", "returned"],
      default: "pending"
    },
    sellerStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "processing", "preparing", "ready_for_dispatch", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    trackingNumber: String,
    shippingProvider: String,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    sellerNotes: String,
    cancellationReason: String,
    returnReason: String,
    returnStatus: {
      type: String,
      enum: ["requested", "approved", "rejected", "picked_up", "refunded"],
      default: null
    }
  },
  { timestamps: true }
);

const SellerOrderSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true
    },
    items: {
      type: [OrderItemSchema],
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    sellerStatus: {
      type: String,
      enum: ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    trackingNumber: {
      type: String,
      default: null
    },
    shippedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: {
      type: [OrderItemSchema],
      required: true
    },
    sellerOrders: {
      type: [SellerOrderSchema],
      required: true
    },
    shippingAddress: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      email: String
    },
    billingAddress: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      email: String
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod", "card", "upi"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "partially_refunded"],
      default: "pending"
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["temporary", "pending", "accepted", "processing", "partially_shipped", "shipped", "delivered", "cancelled", "returned"],
      default: "pending"
    },
    notes: String,
    cancellationReason: String,
    refundAmount: {
      type: Number,
      default: 0
    },
    couponCode: String,
    discountAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

OrderSchema.index({ orderId: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "sellerOrders.seller": 1 });
OrderSchema.index({ "sellerOrders.sellerStatus": 1 });

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;