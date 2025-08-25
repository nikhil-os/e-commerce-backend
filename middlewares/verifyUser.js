const jwt = require('jsonwebtoken');
const User = require('../models/usermodel'); // make sure path is correct

module.exports = async function verifyUser(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    req.flash('error', '🔒 Login required to view this page.');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // ✅ fetch full user
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
    req.user = user; // ✅ assign full user doc
    next();
  } catch (err) {
    console.error("JWT error:", err);
    req.flash('error', '⚠️ Session expired. Please log in again.');
    return res.redirect('/login');
  }
};
