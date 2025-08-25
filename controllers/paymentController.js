require("dotenv").config();
const Razorpay = require("razorpay");
const userModel = require("../models/usermodel");

console.log("DEBUG ENV:", process.env.NODE_ENV);
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.checkoutPage = async (req, res) => {
  const user = await userModel.findById(req.user.id).populate("cart.product");

  const cart = user.cart;
  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const delivery = 50;
  const total = subtotal + delivery;

  res.render("checkout", {
    cart,
    subtotal,
    delivery,
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
    const { addressId, total } = req.body;

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
    const delivery = 50;
    const calculatedTotal = calculatedSubtotal + delivery;

    console.log("💰 Price calculation:", {
      calculatedSubtotal,
      delivery,
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
    const orderId =
      "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    console.log("✅ Order created successfully:", orderId);

    // Here you would typically save the order to database
    // For now, we'll just return the order ID
    // In a real app, you'd save: orderId, userId, addressId, items, total, status: 'pending'

    res.status(200).json({
      success: true,
      order: {
        id: orderId,
        userId: userId,
        addressId: addressId,
        total: calculatedTotal,
        items: user.cart,
        status: "pending",
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

    // Here you would typically:
    // 1. Update order status to "confirmed"
    // 2. Send confirmation email
    // 3. Update inventory
    // 4. ONLY THEN clear the cart

    // Clear user's cart ONLY after successful order confirmation
    user.cart = [];
    await user.save();

    console.log("✅ COD: Order confirmed and cart cleared");

    res.status(200).json({
      success: true,
      message: "Order confirmed with Cash on Delivery",
      orderId: orderId,
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
    const delivery = 50;
    const total = subtotal + delivery;

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

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        orderId: orderId,
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
