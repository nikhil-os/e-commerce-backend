require("dotenv").config();
const Razorpay = require("razorpay");
const userModel = require("../models/usermodel");
const orderModel = require("../models/ordermodel");

console.log("DEBUG ENV:", process.env.NODE_ENV);
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const DELIVERY_FEE = 50;

const normalisePaymentMethod = (method = "") => {
  const value = method.toUpperCase();
  if (value === "COD" || value === "CASH_ON_DELIVERY") return "COD";
  if (value === "ONLINE" || value === "RAZORPAY") return "ONLINE";
  return "UNKNOWN";
};

const findOrderByAnyId = async (orderId) => {
  if (!orderId) return null;
  if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
    const order = await orderModel.findById(orderId);
    if (order) return order;
  }
  return orderModel.findOne({ legacyOrderId: orderId });
};

exports.checkoutPage = async (req, res) => {
  const user = await userModel.findById(req.user.id).populate("cart.product");

  const cart = user.cart;
  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const total = subtotal + DELIVERY_FEE;

  res.render("checkout", {
    cart,
    subtotal,
    delivery: DELIVERY_FEE,
    total,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
  });
};

exports.createOrder = async (req, res) => {
  try {
    console.log("🔄 Create Order Request:", {
      userId: req.user?.id,
      body: req.body,
      headers: req.headers["content-type"],
    });

    const userId = req.user.id;
    const { addressId, total, paymentMethod } = req.body;

    // Validate user has items in cart
    const user = await userModel.findById(userId).populate("cart.product");
    if (!user || !user.cart.length) {
      console.log("❌ Cart is empty for user:", userId);
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    console.log("📋 User cart items:", user.cart.length);

    // Calculate total from actual cart items to prevent tampering
    const calculatedSubtotal = user.cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const calculatedTotal = calculatedSubtotal + DELIVERY_FEE;

    console.log("💰 Price calculation:", {
      calculatedSubtotal,
      deliveryFee: DELIVERY_FEE,
      calculatedTotal,
      providedTotal: total,
    });

    // Verify the total matches (with small tolerance for rounding)
    if (Math.abs(total - calculatedTotal) > 1) {
      console.log("❌ Total amount mismatch");
      return res.status(400).json({
        success: false,
        message: "Total amount mismatch",
      });
    }

    // Generate order ID
    const legacyOrderId =
      "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    const selectedAddress = addressId
      ? user.address?.id(addressId) ||
        user.address?.find((address) => String(address._id) === addressId)
      : user.address?.find((address) => address.isDefault);

    const shippingAddress = selectedAddress
      ? {
          fullName: selectedAddress.fullName,
          mobile: selectedAddress.mobile,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
        }
      : null;

    const orderDoc = await orderModel.create({
      userId,
      legacyOrderId,
      items: user.cart.map((item) => ({
        product: item.product._id || item.product,
        quantity: item.quantity,
      })),
      subtotalAmount: calculatedSubtotal,
      deliveryFee: DELIVERY_FEE,
      totalAmount: calculatedTotal,
      paymentMethod: normalisePaymentMethod(paymentMethod),
      status: "Pending",
      shippingAddress,
    });

    console.log("✅ Order persisted with id:", orderDoc._id.toString());

    res.status(200).json({
      success: true,
      order: {
        id: orderDoc._id.toString(),
        legacyId: legacyOrderId,
        userId,
        addressId,
        total: calculatedTotal,
        items: user.cart,
        status: orderDoc.status,
        paymentMethod: orderDoc.paymentMethod,
      },
    });
  } catch (err) {
    console.error("❌ Create Order Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Process Cash on Delivery payment
exports.processCOD = async (req, res) => {
  try {
    console.log("🔄 Processing COD payment:", {
      orderId: req.params.orderId,
      userId: req.user?.id,
      body: req.body,
    });

    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify user has items in cart before processing
    const user = await userModel.findById(userId).populate("cart.product");
    if (!user || !user.cart.length) {
      console.log("❌ COD: Cart is empty for user:", userId);
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    console.log("✅ COD: Processing payment for", user.cart.length, "items");

    const order = await findOrderByAnyId(orderId);
    if (!order) {
      console.log("❌ COD: Order not found", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = "Confirmed";
    order.paymentMethod = "COD";
    await order.save();

    user.cart = [];
    await user.save();

    console.log("✅ COD: Order confirmed and cart cleared");

    res.status(200).json({
      success: true,
      message: "Order confirmed with Cash on Delivery",
      orderId: order._id.toString(),
    });
  } catch (err) {
    console.error("❌ COD Payment Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Process online payment - Create Razorpay order
exports.processOnlinePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { method } = req.body;
    const userId = req.user.id;

    // Get user and calculate total amount
    console.log("User ID:", userId); // Debug log
    const user = await userModel.findById(userId).populate("cart.product");
    console.log("User found:", !!user, "Cart length:", user?.cart?.length); // Debug log

    if (!user || !user.cart.length) {
      console.log("Cart is empty or user not found"); // Debug log
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const subtotal = user.cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const total = subtotal + DELIVERY_FEE;

    // Create Razorpay order
    const options = {
      amount: total * 100, // Convert to paise
      currency: "INR",
      receipt: `ord_${Date.now()}`, // Keep receipt short (under 40 chars)
      notes: {
        orderId: orderId,
        userId: userId,
        paymentMethod: method,
      },
    };

    console.log("Creating Razorpay order with options:", options); // Debug log
    const razorpayOrder = await razorpayInstance.orders.create(options);
    console.log("Razorpay order created:", razorpayOrder); // Debug log

    const order = await findOrderByAnyId(orderId);
    if (order) {
      order.paymentMethod = "ONLINE";
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    // DO NOT clear cart here - only clear after payment verification
    res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      orderId: orderId,
      razorpayOrder: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
      amount: total,
    });
  } catch (err) {
    console.error("❌ Online Payment Error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      orderId: orderId,
      method: method,
      userId: userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: err.message,
    });
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    const crypto = require("crypto");

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment verified successfully
      const userId = req.user.id;

      // Clear user's cart
      const user = await userModel.findById(userId);
      if (user) {
        user.cart = [];
        await user.save();
      }

      const order = await findOrderByAnyId(orderId);
      if (order) {
        order.status = "Confirmed";
        order.paymentMethod = "ONLINE";
        order.razorpayOrderId = razorpay_order_id;
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();
      }

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        orderId: order ? order._id.toString() : orderId,
        paymentId: razorpay_payment_id,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (err) {
    console.error("❌ Payment Verification Error:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
};
