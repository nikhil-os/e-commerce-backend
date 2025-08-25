const express = require("express");
const router = express.Router();

// 🛡️ Middlewares
const { verifyUser } = require("../middlewares/auth");
const { addToCartValidator } = require("../middlewares/validators");
const { validationResult } = require("express-validator");

// 📦 Controllers
const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} = require("../controllers/cartController");

const { checkoutPage } = require("../controllers/checkoutController");
const { createOrder } = require("../controllers/paymentController");

// ✅ 1. Add to Cart with validation
router.post("/", verifyUser, addToCartValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      errors: errors.array().map((e) => e.msg),
    });
  }
  await addToCart(req, res);
});

// ✅ 1.1. Add to Cart (alternative endpoint for frontend compatibility)
router.post("/add", verifyUser, addToCartValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      errors: errors.array().map((e) => e.msg),
    });
  }
  await addToCart(req, res);
});

// ✅ 2. Get Cart
router.get("/", verifyUser, getCart);

// ✅ 2.1. Get Cart (alternative endpoint for frontend compatibility)
router.get("/cart", verifyUser, getCart);

// ✅ 3. Remove item from cart (POST method for backward compatibility)
router.post("/remove/:productId", verifyUser, (req, res, next) => {
  console.log(
    "Remove cart item request received for productId:",
    req.params.productId
  );
  removeFromCart(req, res);
});

// ✅ 3.1. Remove item from cart (DELETE method for frontend compatibility)
router.delete("/remove/:productId", verifyUser, (req, res, next) => {
  console.log(
    "Remove cart item request received for productId:",
    req.params.productId
  );
  removeFromCart(req, res);
});

// ✅ 4. Update cart item quantity
router.post("/update/:productId", verifyUser, (req, res, next) => {
  console.log(
    "Update cart quantity request received:",
    req.params.productId,
    req.body
  );
  updateCartQuantity(req, res);
});

// ✅ 5. Proceed to Checkout Page
router.get("/checkout", verifyUser, checkoutPage);

// ✅ 6. Create Razorpay order
router.post("/create-order", verifyUser, createOrder);

// 🔧 Debug endpoint - test cart routes without auth (REMOVE IN PRODUCTION)
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Cart router is working!",
    availableEndpoints: [
      "GET /api/cart - Get cart (requires auth)",
      "GET /api/cart/cart - Get cart alternative (requires auth)",
      "POST /api/cart - Add to cart (requires auth)",
      "POST /api/cart/add - Add to cart alternative (requires auth)",
      "POST /api/cart/remove/:productId - Remove from cart (requires auth)",
      "DELETE /api/cart/remove/:productId - Remove from cart alternative (requires auth)",
      "POST /api/cart/update/:productId - Update quantity (requires auth)",
      "GET /api/cart/checkout - Checkout page (requires auth)",
      "POST /api/cart/create-order - Create order (requires auth)",
    ],
  });
});

module.exports = router;
