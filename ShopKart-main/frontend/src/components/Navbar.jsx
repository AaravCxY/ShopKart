import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
    const navigate = useNavigate();
    const { totalItems, clearCart, refreshCart } = useCart();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customerName, setCustomerName] = useState("");

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            try {
                const response = await api.get("/customers/me");
                if (isMounted && response.data && response.data._id) {
                    setIsLoggedIn(true);
                    setCustomerName(response.data.fullName || "");
                    refreshCart();
                }
            } catch (error) {
                if (isMounted) {
                    setIsLoggedIn(false);
                    setCustomerName("");
                }
            }
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogout = async () => {
        try {
            await api.post("/customers/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoggedIn(false);
            setCustomerName("");
            clearCart();
            navigate("/login");
        }
    };

    return (
        <nav className="navbar">
            <Link to={isLoggedIn ? "/home" : "/login"} className="logo-link">
                <p className="logo">🛍️ ShopKart</p>
            </Link>
            <div className="nav-links">
                {isLoggedIn ? (
                    <>
                        <Link to="/home">Home</Link>
                        <Link to="/products">Products</Link>
                        <Link to="/wishlist" className="wishlist-nav-link">
                            ❤️ Wishlist
                        </Link>
                        <Link to="/cart" className="cart-nav-link">
                            🛒 Cart ({totalItems})
                        </Link>
                        <Link to="/orders" className="orders-nav-link">
                            📦 Orders
                        </Link>
                        {customerName && (
                            <span className="user-greeting">Hi, {customerName.split(" ")[0]}</span>
                        )}
                        <button type="button" className="logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
