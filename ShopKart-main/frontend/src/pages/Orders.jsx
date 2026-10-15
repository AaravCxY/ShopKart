import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/orders");
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
            if (err.response?.status === 401) {
                navigate("/login");
            } else {
                setError(err.response?.data?.message || "Failed to load orders.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div>
            <Navbar />
            <div className="page orders-page">
                <div className="cart-header">
                    <h2>My Orders</h2>
                    <p className="cart-count-subtitle">Track, view and manage your order history</p>
                </div>

                {/* 1. Loading State */}
                {loading && (
                    <div className="cart-state-box">
                        <div className="spinner">⏳</div>
                        <p className="loading-text">Loading your orders...</p>
                    </div>
                )}

                {/* 2. Error State */}
                {!loading && error && (
                    <div className="cart-state-box error-box">
                        <p className="error-icon">⚠️</p>
                        <h3>Unable to load your orders</h3>
                        <p className="error-description">{error}</p>
                        <button type="button" className="btn-retry" onClick={fetchOrders}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* 3. Empty State */}
                {!loading && !error && orders.length === 0 && (
                    <div className="cart-state-box empty-box">
                        <div className="empty-cart-icon">📦</div>
                        <h2>You have not placed any orders yet</h2>
                        <p className="empty-subtitle">
                            When you purchase products, your order history will appear here.
                        </p>
                        <Link to="/products" className="btn-primary browse-btn">
                            Start Shopping
                        </Link>
                    </div>
                )}

                {/* 4. Orders List */}
                {!loading && !error && orders.length > 0 && (
                    <div className="orders-list">
                        {orders.map((order) => {
                            const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            });

                            return (
                                <div key={order._id} className="order-card">
                                    <div className="order-card-header">
                                        <div className="order-header-info">
                                            <span className="order-id-label">ORDER #{order._id}</span>
                                            <span className="order-date-text">📅 Placed on {orderDate}</span>
                                        </div>

                                        <div className="order-badges">
                                            <span className={`payment-badge payment-${order.paymentStatus?.toLowerCase()}`}>
                                                💳 {order.paymentStatus}
                                            </span>
                                            <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                                                📦 {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="order-card-body">
                                        {/* Items in the order */}
                                        <div className="order-items-preview">
                                            {order.items?.map((item, index) => (
                                                <div key={item._id || index} className="order-item-row">
                                                    <img
                                                        src={item.image || "https://placehold.co/60x60?text=Product"}
                                                        alt={item.name}
                                                        className="order-item-thumb"
                                                    />
                                                    <div className="order-item-details">
                                                        <p className="order-item-name">{item.name}</p>
                                                        <p className="order-item-meta">
                                                            Qty: <strong>{item.quantity}</strong> × ₹{item.price?.toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                    <div className="order-item-price">
                                                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Order footer with total & action */}
                                        <div className="order-card-footer">
                                            <div className="order-shipping-brief">
                                                <span className="shipping-to-label">Delivering to:</span>
                                                <p className="shipping-to-text">
                                                    {order.shippingAddress?.fullName}, {order.shippingAddress?.city} ({order.shippingAddress?.pincode})
                                                </p>
                                            </div>

                                            <div className="order-footer-right">
                                                <div className="order-grand-total">
                                                    <span className="total-label">Total Amount:</span>
                                                    <span className="total-val">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                                                </div>
                                                <Link to={`/order-success/${order._id}`} className="btn-view-order">
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Orders;
