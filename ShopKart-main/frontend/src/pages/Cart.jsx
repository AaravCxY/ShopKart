import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import api from "../services/api";

function Cart() {
    const navigate = useNavigate();
    const {
        cartItems,
        totalItems,
        subtotal,
        loading,
        error,
        updateQuantity,
        removeFromCart,
        refreshCart
    } = useCart();

    const [updatingId, setUpdatingId] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [actionFeedback, setActionFeedback] = useState("");

    // Check auth on mount
    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            try {
                await api.get("/customers/me");
            } catch (err) {
                if (isMounted) {
                    navigate("/login");
                }
            }
        };
        checkAuth();
        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const handleQuantityChange = async (productId, currentQty, delta, stock) => {
        const newQty = currentQty + delta;
        if (newQty < 1) return;
        if (newQty > stock) {
            setActionFeedback(`Cannot exceed available stock of ${stock} units.`);
            setTimeout(() => setActionFeedback(""), 3000);
            return;
        }

        setUpdatingId(productId);
        setActionFeedback("");

        const res = await updateQuantity(productId, newQty);
        if (!res.success) {
            setActionFeedback(res.message);
            setTimeout(() => setActionFeedback(""), 3000);
        }
        setUpdatingId(null);
    };

    const handleRemove = async (productId) => {
        if (removingId) return;
        setRemovingId(productId);
        setActionFeedback("");

        const res = await removeFromCart(productId);
        if (!res.success) {
            setActionFeedback(res.message);
            setTimeout(() => setActionFeedback(""), 3000);
        }
        setRemovingId(null);
    };

    const handleProceedToCheckout = () => {
        navigate("/checkout");
    };

    return (
        <div>
            <Navbar />
            <div className="page cart-page">
                {/* 1. Loading State */}
                {loading && (
                    <div className="cart-state-box">
                        <div className="spinner">⏳</div>
                        <p className="loading-text">Loading your cart...</p>
                    </div>
                )}

                {/* 2. Error State */}
                {!loading && error !== "" && (
                    <div className="cart-state-box error-box">
                        <p className="error-icon">⚠️</p>
                        <h3>Unable to load your cart.</h3>
                        <p className="error-description">{error}</p>
                        <button type="button" className="btn-retry" onClick={refreshCart}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* 3. Empty State */}
                {!loading && error === "" && cartItems.length === 0 && (
                    <div className="cart-state-box empty-box">
                        <div className="empty-cart-icon">🛒</div>
                        <h2>Your cart is empty</h2>
                        <p className="empty-subtitle">
                            Looks like you haven't added anything yet.
                        </p>
                        <Link to="/products" className="btn-primary browse-btn">
                            Browse Products
                        </Link>
                    </div>
                )}

                {/* 4. Populated Cart State */}
                {!loading && error === "" && cartItems.length > 0 && (
                    <>
                        <div className="cart-header">
                            <h2>My Cart</h2>
                            <p className="cart-count-subtitle">
                                {totalItems} {totalItems === 1 ? "item" : "items"} in cart
                            </p>
                        </div>

                        {actionFeedback && (
                            <p className="error feedback-banner">{actionFeedback}</p>
                        )}

                        <div className="cart-layout">
                            {/* Left: Cart Items List */}
                            <div className="cart-items-list">
                                {cartItems.map((item) => {
                                    const product = item.product;
                                    if (!product) return null;
                                    const isUpdating = updatingId === product._id;
                                    const isRemoving = removingId === product._id;
                                    const itemTotal = (product.price || 0) * item.quantity;

                                    return (
                                        <div key={product._id} className="cart-item-card">
                                            <div className="cart-item-img">
                                                <img src={product.image} alt={product.name} />
                                            </div>

                                            <div className="cart-item-details">
                                                <h3>{product.name}</h3>
                                                <p className="product-category">{product.category}</p>
                                                <p className="cart-item-price">
                                                    ₹{product.price?.toLocaleString("en-IN") || product.price}
                                                </p>
                                                <p className="product-stock-hint">
                                                    {product.stock > 0
                                                        ? `In stock (${product.stock} available)`
                                                        : "Out of stock"}
                                                </p>

                                                <div className="cart-item-controls">
                                                    <div className="quantity-controller">
                                                        <button
                                                            type="button"
                                                            className="qty-btn"
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    product._id,
                                                                    item.quantity,
                                                                    -1,
                                                                    product.stock
                                                                )
                                                            }
                                                            disabled={item.quantity <= 1 || isUpdating}
                                                            title="Decrease quantity"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="qty-value">
                                                            {isUpdating ? "..." : item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="qty-btn"
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    product._id,
                                                                    item.quantity,
                                                                    1,
                                                                    product.stock
                                                                )
                                                            }
                                                            disabled={item.quantity >= product.stock || isUpdating}
                                                            title="Increase quantity"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="btn-remove-item"
                                                        onClick={() => handleRemove(product._id)}
                                                        disabled={isRemoving}
                                                    >
                                                        {isRemoving ? "Removing..." : "Remove"}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="cart-item-total">
                                                <p className="item-total-label">Total</p>
                                                <p className="item-total-value">
                                                    ₹{itemTotal.toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right: Order Summary Sidebar */}
                            <div className="order-summary-box">
                                <h3>Order Summary</h3>
                                <div className="summary-row">
                                    <span>Items ({totalItems})</span>
                                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery</span>
                                    <span className="free-tag">FREE</span>
                                </div>
                                <hr className="summary-divider" />
                                <div className="summary-row total-row">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary checkout-btn"
                                    onClick={handleProceedToCheckout}
                                >
                                    Proceed to Checkout
                                </button>
                                <Link to="/products" className="continue-shopping-link">
                                    ← Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Cart;
