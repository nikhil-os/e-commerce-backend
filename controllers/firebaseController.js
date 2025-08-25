// controllers/firebaseController.js
const admin = require("../config/firebase");
const jwt = require("jsonwebtoken");
const userModel = require("../models/usermodel");

exports.firebaseLogin = async (req, res) => {
  const { firebaseToken } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phoneNumber = decoded.phone_number;

    let user = await userModel.findOne({ contact: phoneNumber });

    if (!user) {
      // Auto-create user if not registered
      user = await userModel.create({
        fullname: "New User",
        email: `${phoneNumber}@example.com`,
        contact: phoneNumber,
        password: "", // optional
        isVerified: true
      });
    }

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true });

    res.json({ success: true, token });
  } catch (err) {
    console.error("Firebase Auth Error:", err.message);
    res.json({ success: false, message: "Invalid Firebase token" });
  }
};
