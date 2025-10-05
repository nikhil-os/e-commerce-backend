const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  signupValidator,
  loginValidator,
} = require("../middlewares/validators");
const { verifyUser } = require("../middlewares/auth");
const User = require("../models/usermodel");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({ dest: "public/uploads/" });

// --- User API Routes ---

// POST /api/users/signup
router.post("/signup", signupValidator, userController.signup);

// POST /api/users/login
router.post("/login", loginValidator, userController.login);

// POST /api/users/logout
router.post("/logout", userController.logout);

// POST /api/users/firebase-login
router.post("/firebase-login", userController.firebaseLogin);

// GET /api/users/profile - Get current user's profile
router.get("/profile", verifyUser, async (req, res) => {
  const freshUser = await User.findById(req.user.id || req.user._id)
    .select("-password")
    .lean();

  res.status(200).json({ user: freshUser });
});

// POST /api/users/update-profile - Update user profile
router.post(
  "/update-profile",
  verifyUser,
  upload.single("profilepic"),
  userController.updateProfile
);

// GET /api/users/orders - Get user orders
router.get("/orders", verifyUser, userController.getUserOrders);

// Password Management
router.post("/forgot-password", userController.forgotPassword); // Assuming this sends an email
router.post("/reset-password", userController.resetPassword);

// Note: GET routes for rendering pages like /login, /signup, /edit-profile
// have been removed as they are now handled by the Next.js frontend.

module.exports = router;
