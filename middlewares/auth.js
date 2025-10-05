const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const {
  registerValidator,
  loginValidator,
} = require("../middlewares/validators");
const { success, error } = require("../utils/response");
const userModel = require("../models/usermodel");

exports.verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let headerToken = null;

  if (typeof authHeader === "string" && authHeader.trim().length > 0) {
    headerToken = authHeader.trim().startsWith("Bearer ")
      ? authHeader.trim().slice(7).trim()
      : authHeader.trim();
  }

  const cookieToken = req.cookies?.token;
  const tokensToCheck = [];

  if (headerToken) tokensToCheck.push(headerToken);
  if (cookieToken && cookieToken !== headerToken)
    tokensToCheck.push(cookieToken);

  // Enhanced logging control - only log when needed
  const shouldLog =
    process.env.LOG_LEVEL !== "minimal" &&
    process.env.NODE_ENV === "development" &&
    !req.cookies.__next_hmr_refresh_hash__;

  if (shouldLog) {
    console.log("🔍 Auth check for:", req.originalUrl, {
      headerTokenPresent: Boolean(headerToken),
      cookieTokenPresent: Boolean(cookieToken),
    });
  }

  if (tokensToCheck.length === 0) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  let decoded = null;
  let lastError = null;

  for (const candidate of tokensToCheck) {
    try {
      decoded = jwt.verify(candidate, process.env.JWT_SECRET);
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!decoded) {
    if (shouldLog && lastError) {
      console.error("🚨 JWT Error:", lastError.message);
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const user = await userModel.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" });
  }

  req.user = user; // ✅ attach user to request
  next();
};

// middlewares/auth.js
exports.verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};
