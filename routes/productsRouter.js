const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const { verifyUser, verifyAdmin } = require("../middlewares/auth");
const upload = require("../utils/multer"); // ✅ required
const Product = require("../models/product");
const Category = require("../models/category");

// Public Routes

// GET all products with pagination, search, and filtering
router.get("/", productController.getAllProducts);

// GET single product by ID (must come before slug route to avoid conflicts)
router.get("/id/:id", productController.getProductById);

// GET single product by slug
router.get("/:slug", productController.getProductBySlug);

// GET products by category (flexible matching by name or slug)
router.get("/category/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    // Try to find by name first, then by slug
    let category = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${identifier}$`, "i") } },
        { slug: identifier.toLowerCase().replace(/\s+/g, "-") },
      ],
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ category: category._id }).populate(
      "category"
    );

    res.json({
      success: true,
      category,
      products,
    });
  } catch (err) {
    console.error("Category products error:", err);
    res.status(500).json({ message: err.message });
  }
});

// User Routes (require authentication)

// POST Add review to product
router.post("/:id/reviews", verifyUser, productController.addReview);

// Admin Routes (require admin authentication)

// POST Create new product
router.post(
  "/",
  verifyUser,
  verifyAdmin,
  upload.single("image"),
  productController.createProduct
);

// PUT Update product image
router.put(
  "/:id/image",
  verifyUser,
  verifyAdmin,
  upload.single("image"),
  productController.updateProductImage
);

// PUT Update product details
router.put("/:id", verifyUser, verifyAdmin, productController.updateProduct);

// DELETE product
router.delete("/:id", verifyUser, verifyAdmin, productController.deleteProduct);

// Legacy routes for compatibility
// GET Add Product Page
router.get(
  "/add-product",
  verifyUser,
  verifyAdmin,
  adminController.getAddProductPage
);

// POST Add Product Form
router.post(
  "/add-product",
  verifyUser,
  verifyAdmin,
  upload.single("imageFile"),
  adminController.createProduct
);

module.exports = router;
