const express = require("express");
const router = express.Router();
const Category = require("../models/category");
const Product = require("../models/product");
const categoryController = require("../controllers/categoryController");
const upload = require("../utils/multer"); // Import multer for file uploads
const { verifyUser, verifyAdmin } = require("../middlewares/auth"); // Import auth middlewares

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new category with image upload (admin only)
router.post(
  "/",
  verifyUser,
  verifyAdmin,
  upload.single("categoryImage"), // Use multer to handle the image upload
  categoryController.createCategory
);

// Update a category with optional image upload (admin only)
router.put(
  "/:id",
  verifyUser,
  verifyAdmin,
  upload.single("categoryImage"), // Use multer to handle the image upload
  categoryController.updateCategory
);

// Get products by category slug
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ category: category._id });
    res.json({
      category,
      products,
    });
  } catch (err) {
    console.error("❌ Error loading category page:", err);
    res.status(500).json({ message: "Failed to load category products" });
  }
});

module.exports = router;
