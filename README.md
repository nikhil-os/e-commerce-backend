# E-Commerce Backend with Cloudinary Integration

This is the backend server for the E-Commerce application, now with Cloudinary integration for image storage.

# 🛒 E-Commerce Backend API

A comprehensive Node.js/Express backend for e-commerce applications with MongoDB, Cloudinary integration, Razorpay payments, and JWT authentication.

## ✨ Features

- **🔐 Authentication & Authorization**: JWT-based auth with admin/user roles
- **🛍️ Product Management**: CRUD operations with category filtering and search
- **🛒 Shopping Cart**: Add, update, remove items with persistent storage
- **💳 Payment Integration**: Razorpay for online payments + Cash on Delivery
- **📱 User Management**: Registration, login, profile management with OTP verification
- **🏷️ Category System**: Organized product categorization with slugs
- **📷 Image Handling**: Cloudinary integration for image uploads and storage
- **📝 Reviews & Ratings**: Product review system with user authentication
- **🔍 Search & Filter**: Advanced product search and filtering capabilities
- **📊 Order Management**: Complete order processing workflow

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Saniya95/E-commerce-backend.git
   cd E-commerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGO_URI=your_mongodb_connection_string
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Razorpay (for payments)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Firebase (optional - for additional features)
   FIREBASE_ADMIN_KEY=your_firebase_admin_sdk_json
   ```

4. **Start the server**
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register` | Register new user | No |
| POST | `/api/users/login` | User login | No |
| POST | `/api/users/logout` | User logout | Yes |
| GET | `/api/users/profile` | Get user profile | Yes |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products (with pagination, search, filter) | No |
| GET | `/api/products/id/:id` | Get product by ID | No |
| GET | `/api/products/:slug` | Get product by slug | No |
| GET | `/api/products/category/:category` | Get products by category | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |
| POST | `/api/products/:id/reviews` | Add product review | User |

### Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get user's cart | Yes |
| POST | `/api/cart/add` | Add item to cart | Yes |
| PUT | `/api/cart/update/:productId` | Update cart item quantity | Yes |
| DELETE | `/api/cart/remove/:productId` | Remove item from cart | Yes |
| DELETE | `/api/cart/clear` | Clear entire cart | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payment/create-order` | Create order | Yes |
| POST | `/api/payment/cod/:orderId` | Process COD payment | Yes |
| POST | `/api/payment/create/:orderId` | Create Razorpay order | Yes |
| POST | `/api/payment/verify` | Verify Razorpay payment | Yes |

### Category Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | Get all categories | No |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **File Upload**: Multer + Cloudinary
- **Payment**: Razorpay Integration
- **Security**: bcrypt, CORS, helmet
- **Validation**: express-validator
- **Environment**: dotenv

## 📁 Project Structure

```
├── controllers/          # Request handlers
│   ├── adminController.js
│   ├── cartController.js
│   ├── productController.js
│   ├── userController.js
│   └── paymentController.js
├── models/               # MongoDB schemas
│   ├── product.js
│   ├── usermodel.js
│   ├── category.js
│   └── ordermodel.js
├── routes/               # API routes
│   ├── productsRouter.js
│   ├── usersRouter.js
│   ├── cartRouter.js
│   ├── paymentRouter.js
│   └── categoryRouter.js
├── middlewares/          # Custom middlewares
│   ├── auth.js
│   ├── adminAuth.js
│   └── validators.js
├── config/               # Configuration files
│   ├── mongoose.js
│   └── cloudinary.js
├── utils/                # Utility functions
│   ├── multer.js
│   └── response.js
├── public/               # Static files
├── scripts/              # Database seeding scripts
└── app.js               # Main application file
```

## 🔧 Development Features

### Database Seeding
```bash
# Access admin panel for seeding data
GET http://localhost:5000/admin.html
```

### Testing Endpoints
- **Product API Test**: `http://localhost:5000/product-id-test.html`
- **Cart Functionality**: `http://localhost:5000/cart-tester.html`
- **Payment Flow**: `http://localhost:5000/razorpay-test.html`
- **Complete Flow**: `http://localhost:5000/complete-flow-test.html`

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_jwt_secret
# ... other production variables
```

### Deploy to Heroku/Railway/Vercel
1. Set environment variables in your deployment platform
2. Ensure MongoDB Atlas is configured for production
3. Update CORS origins for your frontend domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/Saniya95/E-commerce-backend/issues) page
2. Create a new issue with detailed description
3. Contact: [Your Email]

## 🙏 Acknowledgments

- Express.js community
- MongoDB documentation
- Razorpay API documentation
- Cloudinary API documentation

---

**Built with ❤️ for the e-commerce community**

## Migrating Existing Images

If you have existing images stored locally in the `public/uploads` directory, you can migrate them to Cloudinary using the provided script:

```bash
node scripts/migrateToCloudinary.js
```

This script will:

1. Upload all local images to Cloudinary
2. Update database records with new Cloudinary URLs
3. Maintain the existing image associations with products

## Seeding Categories with Images

To populate your database with sample categories and images, you can use the provided seed script:

```bash
node scripts/seedCategories.js
```

This script will:

1. Create default categories (Electronics, Men's Fashion, Women's Fashion, etc.)
2. Upload category images to Cloudinary
3. Store the image URLs in the category documents

You can add sample images to the `sample-images` directory with filenames matching the category names (e.g., `electronics.jpg`, `men's-fashion.jpg`) for custom category images.

## Running the Server

Start the server:

```bash
npm start
```

## Features

- RESTful API for e-commerce operations
- MongoDB database integration
- Cloudinary image storage
- JWT authentication
- Product and category management

## API Endpoints

- `GET /products` - Get all products
- `GET /products/category/:slug` - Get products by category
- `POST /products/add-product` - Add a new product with image upload to Cloudinary
- `GET /categories` - Get all categories
- `POST /categories` - Create a new category with image upload to Cloudinary (admin only)
- `PUT /categories/:id` - Update a category with optional image upload (admin only)
