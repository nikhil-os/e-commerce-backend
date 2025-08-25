const jwt = require("jsonwebtoken");
const userModel = require("../models/usermodel");

exports.adminOnly = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user || !user.isAdmin) {
      return res.status(403).send("Access Denied: Admins Only");
    }

    req.user = user; // so controller can use req.user
    next();
  } catch (err) {
    console.error("❌ Admin auth error:", err);
    res.redirect("/login");
  }
};
