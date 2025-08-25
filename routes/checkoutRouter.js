// routes/checkoutRouter.js
const express = require("express");
const router = express.Router();
const { verifyUser } = require("../middlewares/auth");
const { checkoutPage } = require("../controllers/checkoutController");
const checkoutController = require("../controllers/checkoutController");

// GET /checkout
router.get("/checkout", verifyUser, checkoutPage);
// Add address endpoint that matches frontend request
router.post("/address", verifyUser, checkoutController.saveAddress);
// Keep the original for backward compatibility
router.post("/save-address", verifyUser, checkoutController.saveAddress);
// Add endpoint to get all addresses
router.get("/addresses", verifyUser, checkoutController.getAddresses);

// Import the createOrder function from the payment controller
const { createOrder } = require("../controllers/paymentController");

// Add endpoint for creating an order
router.post("/create-order", verifyUser, createOrder);

// Add endpoint to get order details
router.get("/order/:orderId", verifyUser, checkoutController.getOrderDetails);

module.exports = router;
