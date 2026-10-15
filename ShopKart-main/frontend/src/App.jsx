
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderSuccess from "./pages/OrderSuccess";

function App() {
    return (
        <CartProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" />} />

                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Home />} />

                    <Route path="/products" element={<Products />} />

                    {/* Product details with ID and price */}
                    <Route
                        path="/products/:id/:price"
                        element={<ProductDetails />}
                    />

                    {/* Keep this route for URLs containing only the ID */}
                    <Route
                        path="/products/:id"
                        element={<ProductDetails />}
                    />

                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/orders" element={<Orders />} />

                    <Route
                        path="/order-success/:id"
                        element={<OrderSuccess />}
                    />
                </Routes>
            </BrowserRouter>
        </CartProvider>
    );
}

export default App;
