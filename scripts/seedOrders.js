require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/ordermodel");
const User = require("../models/usermodel");
const Product = require("../models/product");
const Category = require("../models/category");

const seedOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    // Find a user to assign orders to
    const user = await User.findOne();
    if (!user) {
      console.log("❌ No users found. Please create a user first.");
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.fullname} (${user.email})`);

    // Check if we have products, if not create some sample ones
    let products = await Product.find().limit(5);

    if (products.length === 0) {
      console.log("📦 No products found. Creating sample products...");

      const categories = await Category.find().limit(3);
      if (categories.length === 0) {
        console.log(
          "❌ No categories found. Please run seedCategories.js first."
        );
        process.exit(1);
      }

      const sampleProducts = [
        {
          name: "iPhone 15 Pro",
          price: 129999,
          description: "Latest iPhone with A17 Pro chip",
          category: categories[0]._id,
          image: "sample-phone.jpg",
          stock: 50,
        },
        {
          name: 'Samsung Smart TV 55"',
          price: 65999,
          description: "4K Smart TV with HDR support",
          category: categories[0]._id,
          image: "sample-tv.jpg",
          stock: 30,
        },
        {
          name: "Men's Casual Shirt",
          price: 2999,
          description: "Premium cotton casual shirt",
          category: categories[1]._id,
          image: "sample-shirt.jpg",
          stock: 100,
        },
        {
          name: "Women's Handbag",
          price: 4999,
          description: "Elegant leather handbag",
          category: categories[2]._id,
          image: "sample-handbag.jpg",
          stock: 75,
        },
        {
          name: "Bluetooth Headphones",
          price: 8999,
          description: "Wireless noise-cancelling headphones",
          category: categories[0]._id,
          image: "sample-headphones.jpg",
          stock: 60,
        },
      ];

      products = await Product.insertMany(sampleProducts);
      console.log(`✅ Created ${products.length} sample products`);
    }

    console.log(`📦 Found ${products.length} products for orders`);

    // Clear existing orders for this user
    await Order.deleteMany({ userId: user._id });
    console.log("🗑️ Cleared existing orders");

    // Create sample orders with safe access to product properties
    const sampleOrders = [
      {
        userId: user._id,
        items: [
          {
            product: products[0]._id,
            quantity: 2,
          },
          {
            product: products[1]._id,
            quantity: 1,
          },
        ],
        subtotalAmount: products[0].price * 2 + products[1].price,
        deliveryFee: 50,
        totalAmount: products[0].price * 2 + products[1].price + 50,
        paymentMethod: "ONLINE",
        status: "Delivered",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        userId: user._id,
        items: [
          {
            product: products[2]._id,
            quantity: 1,
          },
        ],
        subtotalAmount: products[2].price,
        deliveryFee: 50,
        totalAmount: products[2].price + 50,
        paymentMethod: "COD",
        status: "Shipped",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        userId: user._id,
        items: [
          {
            product: products[3]._id,
            quantity: 3,
          },
        ],
        subtotalAmount: products[3].price * 3,
        deliveryFee: 50,
        totalAmount: products[3].price * 3 + 50,
        paymentMethod: "ONLINE",
        status: "Confirmed",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        userId: user._id,
        items: [
          {
            product: products[0]._id,
            quantity: 1,
          },
        ],
        totalAmount: products[0].price + 50,
        status: "Pending",
        createdAt: new Date(), // Today
      },
    ];

    // Only add the 5th order if we have enough products
    if (products.length >= 5) {
      sampleOrders.push({
        userId: user._id,
        items: [
          {
            product: products[4]._id,
            quantity: 2,
          },
        ],
        subtotalAmount: products[4].price * 2,
        deliveryFee: 50,
        totalAmount: products[4].price * 2 + 50,
        paymentMethod: "ONLINE",
        status: "Cancelled",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      });
    }

    // Insert orders
    const orders = await Order.insertMany(sampleOrders);

    console.log(`✅ Successfully created ${orders.length} sample orders`);
    console.log("📊 Order Summary:");

    // Show stats
    const statusCounts = await Order.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    statusCounts.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count} orders`);
    });

    const totalAmount = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    console.log(`💰 Total orders value: ₹${totalAmount.toLocaleString()}`);
  } catch (error) {
    console.error("❌ Error seeding orders:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔐 Database connection closed");
  }
};

seedOrders();
