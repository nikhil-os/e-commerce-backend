const Product = require("../models/product");
const Category = require("../models/category");
const User = require("../models/usermodel");

exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;
    const query = {};

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const products = await Product.find(query)
      .populate("category")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ message: "Failed to load products" });
  }
};

// Get single product by slug with full details
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug })
      .populate("category")
      .populate({
        path: "reviews.user",
        select: "name email",
      });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ product });
  } catch (err) {
    console.error("Get Product Error:", err);
    res.status(500).json({ message: "Failed to load product" });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching product by ID:", id);

    const product = await Product.findById(id).populate("category").populate({
      path: "reviews.user",
      select: "name email",
    });

    if (!product) {
      console.log("❌ Product not found with ID:", id);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("✅ Product found:", product.name);
    res.json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("❌ Get Product by ID Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load product",
    });
  }
};

// Admin: Create new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      specifications,
      stock,
      tags,
      sku,
    } = req.body;

    // Handle image upload
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      specifications: specifications ? JSON.parse(specifications) : {},
      stock: stock || 0,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      sku,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: err.message,
    });
  }
};

// Admin: Update product image
exports.updateProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.imageUrl = req.file.path; // Cloudinary URL
    await product.save();

    res.json({
      success: true,
      message: "Product image updated successfully",
      imageUrl: product.imageUrl,
    });
  } catch (err) {
    console.error("Update Product Image Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update product image",
      error: err.message,
    });
  }
};

// Admin: Update product details
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (
      updateData.specifications &&
      typeof updateData.specifications === "string"
    ) {
      updateData.specifications = JSON.parse(updateData.specifications);
    }

    if (updateData.tags && typeof updateData.tags === "string") {
      updateData.tags = updateData.tags.split(",").map((tag) => tag.trim());
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message,
    });
  }
};

// Admin: Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message,
    });
  }
};

// Add review to product
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id; // From auth middleware
    const userName = req.user.name;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === userId.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = {
      user: userId,
      userName,
      rating,
      comment,
    };

    product.reviews.push(review);
    product.calculateAverageRating();
    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (err) {
    console.error("Add Review Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: err.message,
    });
  }
};

exports.adminProductPage = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    const categories = await Category.find(); // 👈 You need this to populate category dropdown

    res.render("admin/products", { products, categories });
  } catch (err) {
    console.error("Admin Product Page Error:", err);
    res
      .status(500)
      .render("error", { message: "Failed to load admin product page" });
  }
};
