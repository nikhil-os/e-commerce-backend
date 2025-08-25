const Product = require("../models/product");
const Category = require("../models/category");

exports.categoryPage = async (req, res) => {
  const slug = req.params.slug;

  try {
    // 1. Find category by slug
    const categoryDoc = await Category.findOne({ slug });

    if (!categoryDoc) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. Find products with matching category ID
    const products = await Product.find({ category: categoryDoc._id });

    // 3. Return JSON response
    res.json({
      category: categoryDoc,
      products: products || [],
    });
  } catch (err) {
    console.error("❌ Failed to fetch category products:", err);
    res
      .status(500)
      .json({ message: "Server error while loading category products" });
  }
};

// Create a new category with image upload
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    // Check if category with this name or slug already exists
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "A category with this name already exists",
      });
    }

    // Handle image upload
    let imageUrl = "";
    if (req.file) {
      // If using Cloudinary, the URL is available in req.file.path
      imageUrl = req.file.path;
    }

    // Create new category
    const newCategory = new Category({
      name,
      slug,
      description,
      imageUrl,
    });

    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (err) {
    console.error("❌ Error creating category:", err);
    res.status(500).json({
      message: "Server error while creating category",
    });
  }
};

// Update a category with optional image upload
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Update fields if provided
    if (name) {
      category.name = name;
      // Update slug if name is changed
      category.slug = name.toLowerCase().replace(/\s+/g, "-");
    }

    if (description) {
      category.description = description;
    }

    // Handle image upload if provided
    if (req.file) {
      category.imageUrl = req.file.path;
    }

    await category.save();

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (err) {
    console.error("❌ Error updating category:", err);
    res.status(500).json({
      message: "Server error while updating category",
    });
  }
};
