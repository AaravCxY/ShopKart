import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Wishlist() {
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);

    const fetchWishlist = async () => {
        setLoading(true);
        setError("");

        try {
            // Check auth first
            await api.get("/customers/me");

            const response = await api.get("/wishlist");
            setWishlist(response.data.wishlist || []);
        } catch (err) {
            if (err.response?.status === 401) {
                navigate("/login");
                return;
            }
            setError("Something went wrong. We couldn't load your wishlist.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemove = async (productId) => {
        if (removingId) return;

        setRemovingId(productId);
        try {
            await api.delete("/wishlist/" + productId);
            // Dynamically remove product from React state without page refresh
            setWishlist((prev) => prev.filter((item) => item._id !== productId));
        } catch (err) {
            console.error("Failed to remove product from wishlist:", err);
            if (err.response?.status === 401) {
                navigate("/login");
            } else {
                alert(err.response?.data?.message || "Failed to remove item. Please try again.");
            }
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page wishlist-page">
                {/* 1. Loading State */}
                {loading && (
                    <div className="wishlist-state-box">
                        <div className="spinner">⏳</div>
                        <p className="loading-text">Loading your wishlist...</p>
                    </div>
                )}

                {/* 2. Error State */}
                {!loading && error !== "" && (
                    <div className="wishlist-state-box error-box">
                        <p className="error-icon">⚠️</p>
                        <h3>Something went wrong.</h3>
                        <p className="error-description">{error}</p>
                        <button
                            type="button"
                            className="btn-retry"
                            onClick={fetchWishlist}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* 3. Empty Wishlist State */}
                {!loading && error === "" && wishlist.length === 0 && (
                    <div className="wishlist-state-box empty-box">
                        <div className="empty-heart-icon">❤️</div>
                        <h2>Your wishlist is empty</h2>
                        <p className="empty-subtitle">
                            Save products you love and find them here later.
                        </p>
                        <Link to="/products" className="btn-primary browse-btn">
                            Browse Products
                        </Link>
                    </div>
                )}

                {/* 4. Populated Wishlist View */}
                {!loading && error === "" && wishlist.length > 0 && (
                    <>
                        <div className="wishlist-header">
                            <h2>My Wishlist</h2>
                            <p className="wishlist-count">
                                {wishlist.length} {wishlist.length === 1 ? "product" : "products"} saved
                            </p>
                        </div>

                        <div className="wishlist-grid">
                            {wishlist.map((product) => (
                                <div key={product._id} className="wishlist-card">
                                    <div className="wishlist-card-img">
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                    <div className="wishlist-card-info">
                                        <h3>{product.name}</h3>
                                        <p className="product-category">{product.category}</p>
                                        <p className="product-price">
                                            ₹{product.price?.toLocaleString("en-IN") || product.price}
                                        </p>
                                        <p className="product-stock">
                                            {product.stock > 0
                                                ? `${product.stock} units left`
                                                : "Out of stock"}
                                        </p>
                                    </div>
                                    <div className="wishlist-card-actions">
                                        <button
                                            type="button"
                                            className="btn-details"
                                            onClick={() => navigate("/products/" + product._id)}
                                        >
                                            View Details
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-remove-wishlist"
                                            onClick={() => handleRemove(product._id)}
                                            disabled={removingId === product._id}
                                        >
                                            {removingId === product._id
                                                ? "Removing..."
                                                : "Remove ♥"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Wishlist;
