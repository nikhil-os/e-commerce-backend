// scripts/seedCategories.js
require("dotenv").config({ path: "../.env" }); // Load environment variables
const mongoose = require("mongoose");
const Category = require("../models/category");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");

// Connect to MongoDB using the URI from .env
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to upload a sample image to Cloudinary
const uploadSampleImage = async (categoryName) => {
  try {
    // Check if we have sample images in a directory (optional)
    const sampleImagesDir = path.join(__dirname, "../sample-images");
    let imagePath;

    // Try to find an image matching the category name
    const possibleImagePath = path.join(
      sampleImagesDir,
      `${categoryName.toLowerCase()}.jpg`
    );
    if (fs.existsSync(possibleImagePath)) {
      imagePath = possibleImagePath;
    } else {
      // Default placeholder image if no specific image is found
      imagePath = path.join(sampleImagesDir, "placeholder.jpg");

      // If the sample-images directory doesn't exist or no placeholder, use a default Cloudinary URL
      if (!fs.existsSync(imagePath)) {
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1627579655/e-commerce/placeholder_category.jpg`;
      }
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "e-commerce/categories",
      public_id: categoryName.toLowerCase().replace(/\s+/g, "-"),
      overwrite: true,
    });

    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading image for ${categoryName}:`, error);
    return ""; // Return empty string if upload fails
  }
};

// Seed categories with images
const seedCategories = async () => {
  try {
    // Remove existing categories
    await Category.deleteMany({});

    // Define categories with descriptions
    const categories = [
      {
        name: "Electronics",
        description: "Latest gadgets & electronic devices",
      },
      {
        name: "Men's Fashion",
        description: "Clothing, shoes and accessories for men",
      },
      {
        name: "Women's Fashion",
        description: "Clothing, shoes and accessories for women",
      },
      {
        name: "Home Appliances",
        description: "Essential appliances for your home",
      },
      {
        name: "Footwear",
        description: "Shoes, sandals and boots for all occasions",
      },
      {
        name: "Accessories",
        description: "Fashion accessories to complete your look",
      },
    ];

    // Upload images and create categories
    for (const category of categories) {
      const imageUrl = await uploadSampleImage(category.name);
      const slug = category.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/'/g, "");

      await Category.create({
        name: category.name,
        slug,
        description: category.description,
        imageUrl,
      });

      console.log(`Created category: ${category.name} with image`);
    }

    console.log("All categories seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the seed function
seedCategories();
