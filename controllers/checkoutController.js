// controllers/checkoutController.js
const userModel = require('../models/usermodel');

exports.checkoutPage = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).populate('cart.product');
    if (!user) return res.status(404).render('error', { message: "User not found" });

    const cart = user.cart;

    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.product.price, 0);
    const delivery = 50;
    const total = subtotal + delivery;

    res.render("checkout", { cart, subtotal, 
      delivery,
      total, 
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      addresses: user.address || [],
    });

     } catch (err) {
    console.error("❌ Checkout Error:", err);
    res.status(500).render("error", { message: "Failed to load checkout page" });
  }
};

exports.saveAddress = async (req, res) => {
  const userId = req.user._id;

  // ✅ Convert checkbox value to actual Boolean
  const isDefault = req.body.isDefault === "on";

  const newAddress = {
    fullName: req.body.fullName,
    mobile: req.body.mobile,
    street: req.body.street,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    country: req.body.country,
    isDefault, // ✅ fixed boolean
  };

  try {
    const user = await userModel.findById(userId);

    // ✅ If this is marked as default, remove existing default flags
    if (isDefault) {
      user.address.forEach(addr => addr.isDefault = false);
    }

    user.address.push(newAddress);
    await user.save();

    // Return JSON response for API requests
    res.status(200).json({ 
      success: true, 
      message: "Address saved successfully", 
      address: newAddress 
    });
  } catch (err) {
    console.error("❌ Error saving address:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save address", 
      error: err.message 
    });
  }
};

// Get all addresses for the user
exports.getAddresses = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      addresses: user.address || []
    });
  } catch (err) {
    console.error("❌ Error fetching addresses:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
      error: err.message
    });
  }
};

// Get order details for payment page
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // For now, we'll return mock order details since we're using Razorpay order IDs
    // In a real app, you'd store and retrieve order details from database
    const orderDetails = {
      id: orderId,
      status: "created",
      amount: 0, // You might want to store this in your database
      currency: "INR",
      items: [] // You might want to store cart items with the order
    };
    
    res.status(200).json({
      success: true,
      order: orderDetails
    });
  } catch (err) {
    console.error("❌ Error fetching order details:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: err.message
    });
  }
};
