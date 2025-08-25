const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  imageUrl: {
    type: String,
    default: "", // Default empty string for categories without images
  },
});

module.exports = mongoose.model("Category", categorySchema);
