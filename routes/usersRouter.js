const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  signupValidator,
  loginValidator,
} = require("../middlewares/validators");
const User = require("../models/usermodel");
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({ dest: "public/uploads/" });

// --- API-Centric Authentication Middleware ---
// This middleware protects routes that require a logged-in user.
// It replaces the old `ensureAuth` and `verifyUser` that used redirects.
const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication required. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user information to the request for downstream handlers
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found." });
    }
    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    return res
      .status(401)
      .json({ message: "Authentication failed. Invalid token." });
  }
};

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
// This route is now protected by our API-centric `requireAuth` middleware.
router.get("/profile", requireAuth, (req, res) => {
  // The user object is attached to the request by the `requireAuth` middleware
  res.status(200).json({ user: req.user });
});

// POST /api/users/update-profile - Update user profile
router.post(
  "/update-profile",
  requireAuth,
  upload.single("profilepic"),
  userController.updateProfile
);

// GET /api/users/orders - Get user orders
router.get("/orders", requireAuth, userController.getUserOrders);

// Password Management
router.post("/forgot-password", userController.forgotPassword); // Assuming this sends an email
router.post("/reset-password", userController.resetPassword);

// Note: GET routes for rendering pages like /login, /signup, /edit-profile
// have been removed as they are now handled by the Next.js frontend.

module.exports = router;
