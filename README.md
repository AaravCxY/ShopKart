# ShopKart 🛒

ShopKart is a full-stack online shopping platform developed using **React, Node.js, Express, and MongoDB**. It provides secure user authentication, product search and filtering, cart and wishlist functionality, order management, and integrated **Razorpay payments**.

---

## 🚀 Features

### 🔐 1. User Authentication and Account Management

- **Account Registration:** Allows customers to create accounts using their name, email, phone number, and password.
- **Password Encryption:** Protects user passwords through `bcrypt` hashing with 10 salt rounds.
- **Secure Login Sessions:** Uses JWT authentication with HTTP-only cookies, configured with `sameSite: "lax"` and a 24-hour validity period.
- **Protected Routes:** Express middleware (`protect`) restricts access to authorized users.
- **Automatic Redirection:** Logged-in users are directed to the home dashboard, while guests are redirected to `/login`.
- **Profile and Logout:** Users can view their profiles through `/customers/me` and securely end their sessions by logging out.

---

### 🛍️ 2. Product Browsing and Search

- **Product Listing:** Displays products in a responsive grid with images, names, categories, prices, and current stock availability.
- **Instant Search:** Supports case-insensitive product searches based on product names.
- **Category-Based Filtering:** Enables users to browse categories such as Electronics, Fashion, Books, and Home.
- **Product Information Page:** The `/products/:id` route displays detailed descriptions, images, category labels, stock information, and cart controls.
- **Stock Availability:** Shows the remaining quantity of products or identifies items that are out of stock.

---

### ❤️ 3. Wishlist Management

- **Quick Wishlist Actions:** Users can add or remove products from their favourites through a heart-shaped button.
- **Wishlist Page:** Provides a separate `/wishlist` section to view and manage saved items.
- **Database Persistence:** Stores each customer's wishlist in MongoDB.
- **Instant Interface Updates:** Removes items dynamically without requiring a complete page refresh.
- **Empty Wishlist Message:** Guides users back to the product catalogue when no items have been saved.

---

### 🛒 4. Shopping Cart Functionality

- **Shared Cart State:** Uses React Context (`CartContext`) to keep cart information and navigation badge counts synchronized.
- **Quantity Controls:** Allows customers to increase or decrease product quantities with automatic subtotal updates.
- **Stock Limit Validation:** Applies frontend and backend checks to prevent quantities from exceeding available inventory.
- **Remove Products:** Enables users to delete cart items and immediately recalculate totals.
- **Order Cost Summary:** Displays the item count, total price, free-shipping eligibility, and final payable amount.
- **Empty Cart Screen:** Provides a convenient option to return to shopping when the cart has no items.

---

### 💳 5. Checkout and Razorpay Payments

- **Step-by-Step Checkout:** Lets users review their selected products, order totals, and delivery information before making payment.
- **Automatic Form Filling:** Retrieves the customer's name and phone number from their existing profile.
- **Input Validation:** Checks the customer's name, 10-digit Indian mobile number, street address, city, state, and six-digit postal code.
- **Backend Price Verification:** Recalculates order totals and checks product availability on the server to prevent price manipulation.
- **Razorpay Integration:**
  - Loads the Razorpay checkout SDK dynamically in the browser.
  - Creates payment orders through `/orders/create-payment-order`.
  - Supports UPI, credit and debit cards, NetBanking, and wallets.
  - Confirms payment authenticity using server-side HMAC-SHA256 signature verification through `/orders/verify-payment`.
- **Failed Payment Handling:** Keeps the cart unchanged if a payment fails or is cancelled.
- **Automatic Order Processing:** After successful payment verification, clears the cart and reduces product inventory atomically.

---

### 📦 6. Order History and Tracking

- **Order Dashboard:** Displays previous purchases in descending order of date through `/orders`.
- **Purchase-Time Product Records:** Preserves product names, prices, quantities, and images as they were when the order was placed.
- **Order Status Indicators:** Tracks payment states (`PENDING`, `PAID`, `FAILED`) and fulfilment states (`PENDING_PAYMENT`, `PLACED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`).
- **Order Confirmation:** The `/order-success/:id` page displays the order ID, purchase date, delivery address, purchased products, and total amount paid.

---

### 🎨 7. User Interface and Experience

- **Responsive Design:** Adapts the shopping experience to desktop computers, tablets, and mobile devices.
- **Dynamic Navigation Bar:** Displays login and registration options to guests, while authenticated users see a personalized greeting, wishlist link, cart counter, and logout option.
- **Action Feedback:** Uses loading indicators, error messages, and success notifications to communicate the results of network operations.

---

### 🌱 8. Sample Products and Database Seeding

- Includes a `seed-products.js` script that inserts sample products into the database, covering categories such as Electronics and Fashion with realistic prices and images.

---

## 🛠️ Technology Stack

### Frontend

- **Framework:** React 19 with Vite
- **Routing:** React Router v7
- **State Management:** React Context API (`CartContext`)
- **API Communication:** Axios with cookie credentials enabled
- **Styling:** Custom CSS3 using responsive Flexbox and Grid layouts
- **Code Linting:** Oxlint

### Backend

- **Runtime:** Node.js using ES Modules
- **Server Framework:** Express 5
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) and `bcrypt`
- **Cookie Management:** `cookie-parser`
- **Payment Processing:** Razorpay Node SDK
- **Security Verification:** Cryptographic HMAC-SHA256 signatures

---

## 📁 Project Structure

```text
ShopKart/
├── backend/
│   ├── config/              # Razorpay configuration
│   ├── controllers/         # Authentication, cart, wishlist, products and orders
│   ├── middlewares/         # JWT authentication and route protection
│   ├── models/              # Customer, Product and Order schemas
│   ├── routes/              # Backend API routes
│   ├── utils/               # JWT token helper
│   ├── .env.example         # Environment variable template
│   ├── index.js             # Server entry point and MongoDB connection
│   ├── seed-products.js     # Sample product insertion script
│   └── package.json
├── frontend/
│   ├── public/               # Static icons and favicon
│   ├── src/
│   │   ├── assets/           # Images and other assets
│   │   ├── components/       # Reusable interface components
│   │   ├── context/          # CartContext and custom hook
│   │   ├── pages/            # Home, Login, Register, Products,
│   │   │                     # ProductDetails, Cart, Wishlist,
│   │   │                     # Checkout, Orders and OrderSuccess
│   │   ├── services/         # Axios client and API configuration
│   │   ├── App.jsx           # Application routes and providers
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global and responsive styling
│   ├── index.html            # HTML entry template
│   ├── vite.config.js        # Vite configuration
│   └── package.json
├── .gitignore                # Excludes secrets and generated files
└── README.md
```

---

## 🔌 API Endpoints

| HTTP Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| `POST` | `/customers/register` | Create a customer account | No |
| `POST` | `/customers/login` | Authenticate and set the cookie | No |
| `GET` | `/customers/me` | Retrieve the current user's profile | Yes |
| `POST` | `/customers/logout` | Clear the authentication cookie | Yes |
| `GET` | `/products` | Retrieve products with search and category filters | Yes |
| `GET` | `/products/:id` | Fetch an individual product | Yes |
| `POST` | `/products` | Create a product | Yes |
| `GET` | `/cart` | Retrieve the user's cart | Yes |
| `POST` | `/cart/:productId` | Add a product to the cart | Yes |
| `PATCH` | `/cart/:productId` | Change the quantity of a cart item | Yes |
| `DELETE` | `/cart/:productId` | Delete a cart item | Yes |
| `GET` | `/wishlist` | Retrieve saved products | Yes |
| `POST` | `/wishlist/:productId` | Save a product to the wishlist | Yes |
| `DELETE` | `/wishlist/:productId` | Remove a saved product | Yes |
| `PATCH` | `/wishlist/:productId/toggle` | Add or remove a wishlist item | Yes |
| `POST` | `/orders/create-payment-order` | Calculate the total and create a Razorpay order | Yes |
| `POST` | `/orders/verify-payment` | Verify payment, clear the cart and update stock | Yes |
| `GET` | `/orders` | Retrieve order history | Yes |
| `GET` | `/orders/:id` | Retrieve details of a specific order | Yes |
| `PATCH` | `/orders/:id/status` | Modify an order's fulfilment status | Yes |

---

## ⚙️ Installation and Setup

### 1. Download the Repository

Clone the GitHub repository and navigate to the project directory:

```bash
git clone https://github.com/malav-kumar/ShopKart.git
cd ShopKart
```

### 2. Configure the Backend

Open the backend directory and install its dependencies:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder using `.env.example` as a reference. Add the required configuration:

```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Replace the placeholder values with your actual configuration.

Populate MongoDB with sample products:

```bash
node seed-products.js
```

Launch the backend server:

```bash
npm start
```

### 3. Launch the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will be available at `http://localhost:5173`, while the backend runs at `http://localhost:3000`.

---

## 📄 License

This project is distributed under the **ISC License**.
