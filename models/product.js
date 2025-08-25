const mongoose = require("mongoose");

// Review schema for product reviews
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Changed from "User" to "user" to match usermodel.js
    required: true,
  },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },

  // 🔁 Reference to Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  imageUrl: String, // for URL input
  imageFile: String, // for Multer upload

  // Additional product fields
  specifications: {
    brand: String,
    model: String,
    weight: String,
    dimensions: String,
    material: String,
    warranty: String,
    features: [String],
    color: String,
    size: String,
  },

  // Stock and availability
  stock: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },

  // Reviews and ratings
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  // SEO and metadata
  slug: String,
  tags: [String],
  sku: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Generate slug before saving
productSchema.pre("save", function (next) {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  this.updatedAt = new Date();
  next();
});

// Calculate average rating when reviews are updated
productSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
  }
};

module.exports = mongoose.model("Product", productSchema);
