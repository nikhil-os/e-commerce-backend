/**
 * Script to migrate local images to Cloudinary
 *
 * This script reads all local images from public/uploads directory
 * and uploads them to Cloudinary, then updates the database with the new URLs.
 *
 * Run this script with: node scripts/migrateToCloudinary.js
 */

const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/product");
const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Function to upload file to Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "e-commerce",
      use_filename: true,
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error);
    return null;
  }
};

// Main migration function
const migrateImagesToCloudinary = async () => {
  try {
    const uploadsDir = path.join(__dirname, "../public/uploads");

    // Check if directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log("Uploads directory does not exist");
      return;
    }

    // Read all files from uploads directory
    const files = fs.readdirSync(uploadsDir);

    console.log(`Found ${files.length} files in uploads directory`);

    // Process each file
    for (const file of files) {
      // Only process image files
      if (
        ![".jpg", ".jpeg", ".png"].includes(path.extname(file).toLowerCase())
      ) {
        console.log(`Skipping non-image file: ${file}`);
        continue;
      }

      const filePath = path.join(uploadsDir, file);
      console.log(`Processing file: ${file}`);

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(filePath);

      if (cloudinaryUrl) {
        // Find products using this image
        const localPath = `/uploads/${file}`;
        const products = await Product.find({ imageUrl: localPath });

        if (products.length > 0) {
          console.log(
            `Updating ${products.length} products using image: ${file}`
          );

          // Update each product with the new Cloudinary URL
          for (const product of products) {
            product.imageUrl = cloudinaryUrl;
            await product.save();
            console.log(`Updated product: ${product.name}`);
          }
        } else {
          console.log(`No products found using image: ${file}`);
        }
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the migration
migrateImagesToCloudinary();
