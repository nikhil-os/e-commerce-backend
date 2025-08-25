const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const upload = require("../utils/multer");
const { verifyUser, verifyAdmin } = require("../middlewares/auth");
const Category = require("../models/category");
const Product = require("../models/product");

// Show Add Product Form
router.get(
  "/products/add",
  verifyUser,
  verifyAdmin,
  adminController.getAddProductPage
);

// Handle Form Submission
router.post(
  "/add-product",
  verifyUser,
  verifyAdmin,
  upload.single("image"),
  adminController.createProduct
);

// Update Category Image
router.put(
  "/categories/:slug/image",
  verifyUser,
  verifyAdmin,
  adminController.updateCategoryImage
);

// Seed Database with Dummy Data (Development only)
router.post("/seed-dummy-data", async (req, res) => {
  try {
    // Sample Picsum Photos URLs for dummy data (Working alternatives)
    const sampleImages = [
      "https://picsum.photos/400/300?random=1",
      "https://picsum.photos/400/300?random=2",
      "https://picsum.photos/400/300?random=3",
      "https://picsum.photos/400/300?random=4",
      "https://picsum.photos/400/300?random=5",
    ];

    // Categories data
    const categoriesData = [
      {
        name: "Electronics",
        description: "Latest electronic gadgets and devices",
        imageUrl: "https://picsum.photos/400/300?random=10",
      },
      {
        name: "Clothing",
        description: "Fashion and apparel for all occasions",
        imageUrl: "https://picsum.photos/400/300?random=11",
      },
      {
        name: "Home & Garden",
        description: "Everything for your home and garden",
        imageUrl: "https://picsum.photos/400/300?random=12",
      },
      {
        name: "Sports & Fitness",
        description: "Sports equipment and fitness gear",
        imageUrl: "https://picsum.photos/400/300?random=13",
      },
      {
        name: "Books",
        description: "Books, magazines, and educational materials",
        imageUrl: "https://picsum.photos/400/300?random=14",
      },
    ];

    // Products data for each category
    const productsData = {
      Electronics: [
        {
          name: "Smartphone X1",
          price: 699,
          description: "Latest smartphone with advanced features",
        },
        {
          name: "Laptop Pro 15",
          price: 1299,
          description: "High-performance laptop for professionals",
        },
        {
          name: "Wireless Headphones",
          price: 199,
          description: "Premium noise-canceling headphones",
        },
        {
          name: "Smart Watch",
          price: 299,
          description: "Fitness tracking smartwatch",
        },
        {
          name: "Tablet Air",
          price: 499,
          description: "Lightweight tablet for productivity",
        },
      ],
      Clothing: [
        {
          name: "Cotton T-Shirt",
          price: 25,
          description: "Comfortable cotton t-shirt",
        },
        {
          name: "Denim Jeans",
          price: 79,
          description: "Classic blue denim jeans",
        },
        {
          name: "Winter Jacket",
          price: 149,
          description: "Warm winter jacket",
        },
        {
          name: "Running Shoes",
          price: 89,
          description: "Comfortable running shoes",
        },
        { name: "Dress Shirt", price: 45, description: "Formal dress shirt" },
      ],
      "Home & Garden": [
        {
          name: "Coffee Maker",
          price: 89,
          description: "Automatic coffee maker",
        },
        {
          name: "Garden Tools Set",
          price: 45,
          description: "Complete garden tools set",
        },
        {
          name: "Throw Pillow",
          price: 19,
          description: "Decorative throw pillow",
        },
        { name: "Plant Pot", price: 15, description: "Ceramic plant pot" },
        {
          name: "LED Desk Lamp",
          price: 39,
          description: "Adjustable LED desk lamp",
        },
      ],
      "Sports & Fitness": [
        { name: "Yoga Mat", price: 29, description: "Non-slip yoga mat" },
        {
          name: "Dumbbells Set",
          price: 99,
          description: "Adjustable dumbbells set",
        },
        {
          name: "Tennis Racket",
          price: 79,
          description: "Professional tennis racket",
        },
        {
          name: "Basketball",
          price: 25,
          description: "Official size basketball",
        },
        {
          name: "Fitness Tracker",
          price: 149,
          description: "Advanced fitness tracker",
        },
      ],
      Books: [
        {
          name: "Programming Guide",
          price: 35,
          description: "Complete programming guide",
        },
        {
          name: "Novel Classic",
          price: 12,
          description: "Classic literature novel",
        },
        {
          name: "Cookbook Deluxe",
          price: 28,
          description: "Professional cookbook",
        },
        {
          name: "Science Journal",
          price: 22,
          description: "Monthly science journal",
        },
        {
          name: "Art History Book",
          price: 45,
          description: "Comprehensive art history",
        },
      ],
    };

    // Clear existing data
    console.log("🗑️ Clearing existing data...");
    const deletedCategories = await Category.deleteMany({});
    const deletedProducts = await Product.deleteMany({});
    console.log(`   Deleted ${deletedCategories.deletedCount} categories`);
    console.log(`   Deleted ${deletedProducts.deletedCount} products`);

    // Create categories
    const createdCategories = [];
    for (const categoryData of categoriesData) {
      const slug = categoryData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/&/g, "and");
      const category = new Category({
        ...categoryData,
        slug,
      });
      await category.save();
      createdCategories.push(category);
    }

    // Create products for each category
    let totalProducts = 0;
    for (const category of createdCategories) {
      const products = productsData[category.name];
      if (products) {
        for (let i = 0; i < products.length; i++) {
          const productData = products[i];
          const assignedImageUrl = sampleImages[i % sampleImages.length];
          console.log(
            `   Creating product: ${productData.name} with image: ${assignedImageUrl}`
          );
          const product = new Product({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: category._id,
            imageUrl: assignedImageUrl, // Use the assigned Picsum URL
            stock: Math.floor(Math.random() * 100) + 10, // Random stock between 10-110
            isAvailable: true,
            specifications: productData.specifications || {},
            tags: productData.tags || [],
            sku: `${category.name
              .substring(0, 3)
              .toUpperCase()}-${productData.name
              .substring(0, 3)
              .toUpperCase()}-${Date.now().toString().slice(-4)}`,
          });
          await product.save();
          totalProducts++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Database seeded successfully with dummy data!",
      data: {
        categoriesCreated: createdCategories.length,
        productsCreated: totalProducts,
        productsPerCategory: 5,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    res.status(500).json({
      success: false,
      message: "Error seeding database",
      error: error.message,
    });
  }
});

// Check for broken image URLs (Development only)
router.get("/check-image-urls", async (req, res) => {
  try {
    const Product = require("../models/product");
    const Category = require("../models/category");

    // Find products with broken Cloudinary URLs
    const brokenProducts = await Product.find({
      imageUrl: { $regex: "res.cloudinary.com/demo" },
    }).select("name imageUrl");

    // Find categories with broken Cloudinary URLs
    const brokenCategories = await Category.find({
      imageUrl: { $regex: "res.cloudinary.com/demo" },
    }).select("name imageUrl");

    // Find products with working Picsum URLs
    const workingProducts = await Product.find({
      imageUrl: { $regex: "picsum.photos" },
    })
      .select("name imageUrl")
      .limit(5);

    // Find categories with working Picsum URLs
    const workingCategories = await Category.find({
      imageUrl: { $regex: "picsum.photos" },
    }).select("name imageUrl");

    res.json({
      success: true,
      summary: {
        brokenProducts: brokenProducts.length,
        brokenCategories: brokenCategories.length,
        workingProducts: workingProducts.length,
        workingCategories: workingCategories.length,
      },
      brokenUrls: {
        products: brokenProducts,
        categories: brokenCategories,
      },
      workingUrls: {
        products: workingProducts,
        categories: workingCategories,
      },
    });
  } catch (error) {
    console.error("Error checking image URLs:", error);
    res.status(500).json({
      success: false,
      message: "Error checking image URLs",
      error: error.message,
    });
  }
});

module.exports = router;
