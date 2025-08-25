const { body } = require('express-validator');

exports.signupValidator = [
  body('fullname').notEmpty().withMessage('Fullname is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('contact').isLength({ min: 10 }).withMessage('Contact must be at least 10 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];


exports.addToCartValidator = [
  body('productId').notEmpty().withMessage("Product ID is required"),
  body('quantity').isInt({ min: 1 }).withMessage("Quantity must be at least 1")
];
