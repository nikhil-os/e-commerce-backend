const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Manually set environment variables for testing
process.env.PORT = process.env.PORT || "5000";
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://ahmedsaniya992:LWvhTgBjeUWtiC8v@cluster0.wbgtti9.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "your_secret_key_for_jwt_tokens";
process.env.RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID || "rzp_test_b5DTwApoKioOxQ";
process.env.RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "ysXc75C3VVbkOWvCbPuD8JZG";
process.env.CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || "dqabvcqk7";
process.env.CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY || "599447595942263";
process.env.CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || "3FVtoPqeEAdqOjm9aDLshiTVscs";

console.log("Dotenv loaded from path:", path.join(__dirname, ".env"));
console.log("PORT from env:", process.env.PORT);
console.log("NODE_ENV from env:", process.env.NODE_ENV);

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Connect DB
const connectDB = require("./config/mongoose");
connectDB();

// CORS Configuration
// This is important to allow your Next.js frontend to communicate with the API.
const corsOptions = {
  origin: [
    "http://localhost:3000",
    process.env.PROD_ORIGIN || "https://your-prod-domain",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Ensure credentials flag is always exposed
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Add CORS preflight for all routes
app.options("*", cors(corsOptions));

// Core Middleware
app.use(express.json({ limit: "50mb" })); // Increase JSON payload limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Increase URL-encoded payload limit
app.use(cookieParser()); // Must be before any route that needs to parse cookies

// Simple cache middleware for development
const cache = new Map();
const cacheMiddleware = (duration = 300000) => {
  // 5 minutes default
  return (req, res, next) => {
    // Skip caching in development for auth routes to avoid login issues
    if (
      process.env.NODE_ENV !== "production" &&
      (req.path.includes("/users/") || req.path.includes("/cart"))
    ) {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data) {
      if (res.statusCode === 200) {
        cache.set(key, { data, timestamp: Date.now() });
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Serve user-uploaded files
// Assuming 'public/uploads' is where you store uploaded images.
// The '/uploads' route will now be accessible at `http://localhost:5000/uploads/...`
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Special route to serve placeholder image for frontend
const sendPlaceholder = (req, res) => {
  const allowedOrigin = corsOptions.origin.find(
    (origin) => origin === req.headers.origin
  );
  if (allowedOrigin) {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
  }
  const placeholderPath = path.join(
    __dirname,
    "public",
    "placeholder-product.jpg"
  );
  res.sendFile(placeholderPath, (err) => {
    if (err) {
      console.log("Placeholder not found, sending SVG response");
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(`<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <rect x="50" y="50" width="300" height="200" fill="#d0d0d0" stroke="#999" stroke-width="2"/>
        <circle cx="200" cy="120" r="30" fill="#999"/>
        <polygon points="170,160 200,130 230,160 220,180 180,180" fill="#999"/>
        <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">Product Image</text>
      </svg>`);
    }
  });
};

app.get("/placeholder-product.jpg", sendPlaceholder);
app.get("/api/static/placeholder-product.jpg", sendPlaceholder);

// API Routers
// All API routes are now prefixed with /api
const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require("./routes/productsRouter");
const usersRouter = require("./routes/usersRouter");
const cartRouter = require("./routes/cartRouter");
const paymentRouter = require("./routes/paymentRouter");
const categoryRouter = require("./routes/categoryRouter");
const adminRouter = require("./routes/adminRouter");
const checkoutRouter = require("./routes/checkoutRouter");
const staticRouter = require("./routes/staticRouter");

// Mount Routers under /api prefix with caching for static routes
app.use("/api/owners", ownersRouter);
app.use("/api/products", cacheMiddleware(600000), productsRouter); // 10 min cache for products
app.use("/api/users", usersRouter);
app.use("/api/cart", cartRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/categories", cacheMiddleware(900000), categoryRouter); // 15 min cache for categories
app.use("/api/admin", adminRouter);
app.use("/api/checkout", checkoutRouter);

// Static routes (no /api prefix)
app.use("/", staticRouter);

// Basic health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" });
});
// Root route for Render health and user-friendly message
app.get("/", (req, res) => {
  res.send("E-commerce backend is running!");
});

// Test route for cart
app.get("/api/test-cart", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Cart endpoint is accessible" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
