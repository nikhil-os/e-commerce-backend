const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // adjust path as needed

router.get('/', async (req, res) => {
    try {
        const products = await Product.find(); // fetch all products
        res.render('home', { products }); // pass to frontend
    } catch (err) {
        res.status+
        (500).send("Error loading products");
    }
});

module.exports = router;
