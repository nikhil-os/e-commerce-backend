const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    legacyOrderId: {
      type: String,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: { type: Number, required: true },
      },
    ],
    subtotalAmount: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "UNKNOWN"],
      default: "UNKNOWN",
    },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    },
    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("order", orderSchema);
