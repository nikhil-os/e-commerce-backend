const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});

router.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact Us" });
});

router.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  req.flash("success", "Message sent successfully!");
  res.redirect("/contact");
});

// Product detail page route
router.get("/product/:slug", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/product-detail.html"));
});

module.exports = router;
