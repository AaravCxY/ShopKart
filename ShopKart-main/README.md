# ShopKart 🛒

A full-stack e-commerce web application built with **React**, **Node.js**, **Express**, and **MongoDB**, featuring secure JWT cookie authentication, real-time product discovery, dynamic cart and wishlist management, and complete end-to-end **Razorpay** payment integration.

---

## 🚀 Features

### 🔐 1. Authentication & User Management
- **User Registration**: Secure account creation with full name, email, phone number, and password validation.
- **Password Security**: Passwords safely hashed using `bcrypt` (salt rounds: 10) before database storage.
- **JWT & HTTP-Only Cookies**: Issues JSON Web Tokens stored in secure HTTP-only cookies (`sameSite: "lax"`, 24h validity) to guard against XSS token theft.
- **Session Protection**: Express middleware (`protect`) enforces route authorization across all private endpoints.
- **Smart Navigation**: Automatically routes authenticated users to the home dashboard and redirects unauthenticated users to `/login`.
- **User Profile & Logout**: Instant profile access (`/customers/me`) and clean cookie invalidation on logout.

---

### 🛍️ 2. Product Catalog & Discovery
- **Product Browsing**: Responsive grid displaying products with images, titles, categories, pricing, and live stock count.
- **Real-Time Search**: Instant search filtering by product name using case-insensitive database queries.
- **Category Filtering**: Filter products by categories (Electronics, Fashion, Books, Home, etc.).
- **Detailed Product Page**: Dedicated view (`/products/:id`) showing high-resolution product imagery, detailed descriptions, category tags, stock status, and add-to-cart controls.
- **Live Inventory Indicators**: Visual stock cues indicating remaining available units or marking items as "Out of Stock".

---

### ❤️ 3. Wishlist System
- **One-Click Wishlist Toggle**: Easily save or remove favorite items using the heart toggle on product cards and product detail pages.
- **Dedicated Wishlist View**: Manage all saved products on a dedicated `/wishlist` page.
- **Persistent Storage**: Saved items are tied to each customer's account in MongoDB.
- **Optimistic UI Updates**: Dynamic removal from wishlist without requiring full page reloads.
- **Empty State UX**: Helpful empty state banner guiding users back to the product catalog when wishlist is empty.

---

### 🛒 4. Shopping Cart System
- **Global Cart State**: Powered by React Context (`CartContext`) ensuring live badge count updates in the navigation bar.
- **Quantity Adjuster**: Increment and decrement item quantities directly inside the cart with instant subtotal calculations.
- **Inventory Bounds Checking**: Frontend and backend enforce stock ceilings, preventing users from adding or increasing items beyond warehouse stock.
- **Item Removal**: One-click deletion of cart items with immediate total recalculation.
- **Live Order Summary**: Breakdown showing item count, total price, free shipping status, and payable amount.
- **Empty Cart Handling**: Informative empty cart view with one-click navigation back to shopping.

---

### 💳 5. Checkout & Razorpay Payment Integration
- **Multi-Step Checkout Flow**: Review cart items, order breakdown, and delivery details prior to payment.
- **Pre-Filled Shipping Form**: Automatically populates full name and contact number from user profile.
- **Client-Side Form Validation**: Validates full name, 10-digit Indian mobile number, street address, city, state, and 6-digit postal code.
- **Server-Side Price & Stock Verification**: Recalculates order total on the backend at checkout to prevent client-side price tampering.
- **Razorpay Payment Gateway**:
  - Dynamically loads Razorpay checkout SDK in the browser.
  - Generates secure Razorpay order ID on the backend (`/orders/create-payment-order`).
  - Opens seamless Razorpay payment modal supporting UPI, Cards, NetBanking, and Wallets.
  - Verifies payment authenticity via server-side **HMAC-SHA256 signature verification** (`/orders/verify-payment`).
- **Cart Protection on Payment Failure**: If payment fails or is cancelled, the user's cart remains completely intact.
- **Automated Inventory & Cart Cleanup**: Upon verified payment, the user's cart is automatically cleared and inventory stock is atomically decremented.

---

### 📦 6. Order History & Tracking
- **My Orders Dashboard**: View all past orders sorted by newest first (`/orders`).
- **Item Snapshot Preservation**: Stores product title, price, quantity, and image at the exact time of purchase so future product modifications do not alter historical invoices.
- **Real-Time Status Badges**:
  - **Payment Status**: `PENDING`, `PAID`, `FAILED`
  - **Fulfillment Status**: `PENDING_PAYMENT`, `PLACED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`
- **Order Confirmation Page**: Detailed post-checkout confirmation screen (`/order-success/:id`) showing order ID, purchase date, shipping destination, purchased items, and total paid.

---

### 🎨 7. UI & UX Highlights
- **Responsive Layout**: Designed for seamless browsing across desktop, tablet, and mobile devices.
- **Interactive Navbar**: Dynamic navbar displaying login/register buttons for guests, or user greeting, Wishlist link, Cart badge counter, and Logout button for authenticated users.
- **Asynchronous Feedback**: Integrated spinners, error banners, and success toast messages for all network actions.

---

### 🌱 8. Database Seeding & Mock Inventory
- Pre-configured `seed-products.js` script to instantly populate the database with sample products across categories (Electronics, Fashion, etc.) with realistic prices and images.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router v7
- **State Management**: React Context API (`CartContext`)
- **HTTP Client**: Axios (with cookie credentials enabled)
- **Styling**: Custom CSS3 with responsive flexbox and grid layouts
- **Linter**: Oxlint

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcrypt`
- **Cookies**: `cookie-parser`
- **Payments**: Razorpay Node SDK
- **Security**: Cryptographic HMAC-SHA256 signature verification

---

## 📁 Project Structure

```
ShopKart/
├── backend/
│   ├── config/              # Razorpay configuration
│   ├── controllers/         # Request handlers (auth, cart, wishlist, products, orders)
│   ├── middlewares/         # JWT authentication & route protection middleware
│   ├── models/              # Mongoose schemas (Customer, Product, Order)
│   ├── routes/              # Express API route declarations
│   ├── utils/               # JWT token generator helper
│   ├── .env.example         # Template for environment variables
│   ├── index.js             # Express server entry point & MongoDB connection
│   ├── seed-products.js     # Database seeder for sample inventory
│   └── package.json
├── frontend/
│   ├── public/              # Static SVG icons and favicon
│   ├── src/
│   │   ├── assets/          # Static images
│   │   ├── components/      # Reusable UI components (Navbar, ProductCard, SearchBar)
│   │   ├── context/         # Global CartContext provider and custom hook
│   │   ├── pages/           # Application views (Home, Login, Register, Products,
│   │   │                    # ProductDetails, Cart, Wishlist, Checkout, Orders, OrderSuccess)
│   │   ├── services/        # Axios API client configured with baseURL & withCredentials
│   │   ├── App.jsx          # Route hierarchy and context wrappers
│   │   ├── main.jsx         # React application root
│   │   └── index.css        # Global styles and responsive design
│   ├── index.html           # HTML template
│   ├── vite.config.js       # Vite build configuration
│   └── package.json
├── .gitignore               # Excludes secrets (.env), node_modules, and build dist
└── README.md
```

---

## 🔌 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/customers/register` | Register a new customer | No |
| `POST` | `/customers/login` | Login & set HTTP-only cookie | No |
| `GET` | `/customers/me` | Fetch logged-in customer profile | **Yes** |
| `POST` | `/customers/logout` | Clear auth token cookie | **Yes** |
| `GET` | `/products` | List products with search & category filters | **Yes** |
| `GET` | `/products/:id` | Get single product details | **Yes** |
| `POST` | `/products` | Create a new product | **Yes** |
| `GET` | `/cart` | Get current user's shopping cart | **Yes** |
| `POST` | `/cart/:productId` | Add product to cart | **Yes** |
| `PATCH` | `/cart/:productId` | Update item quantity in cart | **Yes** |
| `DELETE` | `/cart/:productId` | Remove item from cart | **Yes** |
| `GET` | `/wishlist` | Get current user's wishlist | **Yes** |
| `POST` | `/wishlist/:productId` | Add product to wishlist | **Yes** |
| `DELETE` | `/wishlist/:productId` | Remove product from wishlist | **Yes** |
| `PATCH` | `/wishlist/:productId/toggle` | Toggle item in/out of wishlist | **Yes** |
| `POST` | `/orders/create-payment-order` | Calculate totals & create Razorpay order | **Yes** |
| `POST` | `/orders/verify-payment` | Verify HMAC signature, clear cart, deduct stock | **Yes** |
| `GET` | `/orders` | Get user order history (newest first) | **Yes** |
| `GET` | `/orders/:id` | Get details of a specific order | **Yes** |
| `PATCH` | `/orders/:id/status` | Update fulfillment status of order | **Yes** |

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/malav-kumar/ShopKart.git
cd ShopKart
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on `.env.example`:
```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Seed initial products into your MongoDB database:
```bash
node seed-products.js
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and connect to the backend on `http://localhost:3000`.

---

## 📄 License
ISC
