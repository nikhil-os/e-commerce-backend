const { validationResult } = require("express-validator");
const userModel = require("../models/usermodel");
const Product = require("../models/product");
const orderModel = require("../models/ordermodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("../firebase/firebase-admin");
const path = require("path");
const fs = require("fs");

const isProduction = process.env.NODE_ENV === "production";
const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// 🔐 SIGNUP
exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const { fullname, email, contact, location, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      fullname,
      email,
      contact,
      location,
      password: hashed,
      isVerified: true, // Assuming direct verification for now
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, TOKEN_COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Signup Error: ", err);
    return res
      .status(500)
      .json({ message: "An error occurred during signup." });
  }
};

// 🔐 LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, TOKEN_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("❌ Login Error: ", err);
    return res.status(500).json({ message: "An error occurred during login." });
  }
};

// 🔐 Firebase OTP Login
exports.firebaseLogin = async (req, res) => {
  const { firebaseToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const phone = decodedToken.phone_number;
    const user = await userModel.findOne({ contact: phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, TOKEN_COOKIE_OPTIONS);
    return res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ success: false, message: "Invalid Firebase token" });
  }
};

// 🔐 Forgot Password via Firebase OTP
exports.forgotPassword = async (req, res) => {
  res.render("users/forgot-password");
};

// 🔐 Reset Password
exports.resetPassword = async (req, res) => {
  const { firebaseToken, newPassword, confirmPassword, email } = req.body;

  try {
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const phone = decodedToken.phone_number;

    const user = await userModel.findOne({ contact: phone, email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this phone and email",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ success: false, message: "Reset failed: " + err.message });
  }
};

// 🔐 Profile Page
exports.profilePage = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    // 👇 log for debug (optional)
    console.log("Is Admin:", user.isAdmin);

    res.render("users/profile", {
      user: user, // ✅ pass full user object
      orders: user.orders || [],
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    req.flash("error", "Profile load failed");
    return res.redirect("/");
  }
};

// 🔓 LOGOUT
exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  });

  if (req.xhr || req.headers["content-type"] === "application/json") {
    return res.status(200).json({ success: true, message: "Logged out" });
  }

  req.flash("success", "You have been logged out.");
  res.redirect("/login");
};

exports.getEditProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    res.render("users/edit-profile", { user });
  } catch (err) {
    console.error("❌ Error loading edit profile page:", err);
    res.redirect("/users/profile");
  }
};

// Handle Profile Update
exports.updateProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { fullname, contact, location } = req.body;

    // Check for new image
    if (req.file) {
      // Optional: Delete old image
      if (user.profilepic && user.profilepic !== "default-user.png") {
        const oldPath = path.join(
          __dirname,
          "../public/uploads",
          user.profilepic
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.profilepic = req.file.filename;
    }

    user.fullname = fullname || user.fullname;
    user.contact = contact || user.contact;
    user.location = location || user.location;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        contact: user.contact,
        location: user.location,
        profilepic: user.profilepic,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

// Get User Orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch orders for the user and populate product details
    const orders = await orderModel
      .find({ userId })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .sort({ createdAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      orders: orders,
      totalOrders: orders.length,
    });
  } catch (err) {
    console.error("❌ Error fetching user orders:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
};
