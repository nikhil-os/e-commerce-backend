const express = require("express");
const router = express.Router();
const { verifyUser } = require("../middlewares/auth");
const {
  checkoutPage,
  createOrder,
  processCOD,
  processOnlinePayment,
  verifyPayment,
} = require("../controllers/paymentController");

router.get("/checkout", verifyUser, checkoutPage);
router.post("/create-order", verifyUser, createOrder);
router.post("/cod/:orderId", verifyUser, processCOD);
router.post("/create/:orderId", verifyUser, processOnlinePayment);
router.post("/verify", verifyUser, verifyPayment);

module.exports = router;
