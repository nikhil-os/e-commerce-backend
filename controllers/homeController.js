const Product = require('../models/product');
const Category = require('../models/category');

exports.getHomePage = async (req, res) => {
  try {
    // ✅ Get all categories
    const categories = await Category.find();

    // ✅ Get all products with populated category reference
    const products = await Product.find().populate('category');

    // ✅ Group products under each category
    const categorizedProducts = categories.map(cat => {
      return {
        category: cat.name,
        slug: cat.slug,
        products: products.filter(p => p.category.slug === cat.slug)
      };
    });

    res.render('index', {
      title: "Home",
      categorizedProducts // ✅ This contains { category, slug, products[] }
    });

  } catch (err) {
    console.error("Home page error:", err);
    res.status(500).render("error", { message: "Failed to load homepage" });
  }
};
