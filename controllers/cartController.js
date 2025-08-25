const userModel = require("../models/usermodel");
const product = require("../models/product");
const mongoose = require("mongoose");

// ✅ Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate the product ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const user = await userModel.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Check if product exists
    const productExists = await product.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existingItem = user.cart.find(
      (item) => item.product && item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      user.cart.push({ product: productId, quantity: Number(quantity) });
    }

    await user.save();
    res.status(200).json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
};

// ✅ Get cart page with populated products
exports.getCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).populate("cart.product");

    // Filter out cart items with deleted/null products and calculate total
    const cartItems = user.cart || [];
    const validCartItems = cartItems.filter((item) => item.product !== null);

    // Remove invalid cart items from user's cart
    if (validCartItems.length !== cartItems.length) {
      user.cart = validCartItems;
      await user.save();
      console.log(
        `🧹 Cleaned ${
          cartItems.length - validCartItems.length
        } invalid cart items`
      );
    }

    const subtotal = validCartItems.reduce((total, item) => {
      // Double-check that product exists and has a price
      if (item.product && typeof item.product.price === "number") {
        return total + item.product.price * item.quantity;
      }
      return total;
    }, 0);

    const delivery = validCartItems.length > 0 ? 50 : 0; // No delivery fee for empty cart
    const total = subtotal + delivery;

    // Return JSON response for API
    res.json({
      success: true,
      items: validCartItems,
      subtotal,
      delivery,
      total,
      itemCount: validCartItems.length,
    });
  } catch (err) {
    console.error("❌ Error loading cart:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load cart",
    });
  }
};

// ✅ Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Filter out the specified product and also remove any null products
    const originalLength = user.cart.length;
    user.cart = user.cart.filter((item) => {
      // Remove null products and the specified product
      return item.product !== null && item.product.toString() !== productId;
    });

    const removedCount = originalLength - user.cart.length;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Item${removedCount > 1 ? "s" : ""} removed from cart`,
      removedCount: removedCount,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
};

// ✅ Update cart quantity
exports.updateCartQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const item = user.cart.find(
      (i) => i.product !== null && i.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    item.quantity = Number(quantity);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      newQuantity: item.quantity,
    });
  } catch (error) {
    console.error("Update cart quantity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart quantity",
      error: error.message,
    });
  }
};
