const Product = require("../models/product");
const Category = require("../models/category");

// 👇 Get Add Product Page with categories
const getAddProductPage = async (req, res) => {
  try {
    const categories = await Category.find(); // Fetch all categories from DB
    res.render("admin/add-product", {
      title: "Add Product",
      categories, // Pass categories to EJS
    });
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res
      .status(500)
      .render("error", { message: "Error loading add product page" });
  }
};

// 👇 Create Product Handler (POST)
const createProduct = async (req, res) => {
  try {
    const { name, price, description, categorySlug, imageUrl } = req.body;
    let imagePath;

    // ✅ Use uploaded file (now from Cloudinary) or imageUrl
    if (req.file) {
      // Cloudinary returns the URL in req.file.path
      imagePath = req.file.path;
    } else if (imageUrl) {
      imagePath = imageUrl;
    }

    // ✅ Validate required fields
    if (!name || !price || !categorySlug) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and category are required",
      });
    }

    // ✅ Fetch category based on slug
    const categoryDoc = await Category.findOne({
      slug: categorySlug.toLowerCase(),
    });
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    // ✅ Create product with category ID
    const newProduct = new Product({
      name,
      price: Number(price),
      imageUrl: imagePath,
      description,
      category: categoryDoc._id,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (err) {
    console.error("❌ Product Create Error:", err);
    res.status(500).json({
      success: false,
      message: "Product creation failed",
      error: err.message,
    });
  }
};

// 👇 Update Category Image (PUT)
const updateCategoryImage = async (req, res) => {
  try {
    console.log("🔄 Update Category Image Request:", {
      slug: req.params.slug,
      body: req.body,
      user: req.user
        ? { id: req.user._id, isAdmin: req.user.isAdmin }
        : "No user",
    });

    const { slug } = req.params;
    const { imageUrl } = req.body;

    // ✅ Validate required fields
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    // ✅ Find and update category
    const category = await Category.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      {
        image: imageUrl,
        imageUrl: imageUrl, // Support both field names
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category image updated successfully",
      category: {
        slug: category.slug,
        name: category.name,
        imageUrl: category.image || category.imageUrl,
      },
    });
  } catch (err) {
    console.error("❌ Category Image Update Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update category image",
      error: err.message,
    });
  }
};

module.exports = {
  getAddProductPage,
  createProduct,
  updateCategoryImage,
};
