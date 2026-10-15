import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function OrderSuccess() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/orders/${id}`);
                if (isMounted && response.data?.order) {
                    setOrder(response.data.order);
                }
            } catch (err) {
                console.error("Error fetching order:", err);
                if (isMounted) {
                    if (err.response?.status === 401) {
                        navigate("/login");
                    } else {
                        setError(err.response?.data?.message || "Could not retrieve order details.");
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (id) {
            fetchOrder();
        }
        return () => {
            isMounted = false;
        };
    }, [id, navigate]);

    return (
        <div>
            <Navbar />
            <div className="page order-success-page">
                {loading && (
                    <div className="cart-state-box">
                        <div className="spinner">⏳</div>
                        <p>Loading order details...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="cart-state-box error-box">
                        <p className="error-icon">⚠️</p>
                        <h3>Order Not Found</h3>
                        <p className="error-description">{error}</p>
                        <Link to="/products" className="btn-primary browse-btn">
                            Return to Shop
                        </Link>
                    </div>
                )}

                {!loading && !error && order && (
                    <div className="success-container">
                        <div className="success-banner">
                            <div className="success-icon">✅</div>
                            <h2>Order Placed Successfully!</h2>
                            <p className="success-subtitle">
                                Thank you for your purchase. Your payment was verified and your order is confirmed.
                            </p>
                        </div>

                        <div className="success-card">
                            <div className="order-meta-header">
                                <div>
                                    <span className="meta-label">ORDER ID</span>
                                    <p className="meta-value font-mono">#{order._id}</p>
                                </div>
                                <div>
                                    <span className="meta-label">DATE</span>
                                    <p className="meta-value">
                                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <span className="meta-label">STATUS</span>
                                    <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="meta-label">PAYMENT</span>
                                    <span className={`payment-badge payment-${order.paymentStatus?.toLowerCase()}`}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <hr className="divider" />

                            <div className="order-details-grid">
                                {/* Ordered Items List */}
                                <div className="ordered-items-section">
                                    <h4>Purchased Items ({order.items?.length})</h4>
                                    <div className="items-list">
                                        {order.items?.map((item) => (
                                            <div key={item._id || item.product} className="ordered-item-row">
                                                <img
                                                    src={item.image || "https://placehold.co/80x80?text=Product"}
                                                    alt={item.name}
                                                    className="item-thumb"
                                                />
                                                <div className="item-info">
                                                    <p className="item-title">{item.name}</p>
                                                    <p className="item-qty-price">
                                                        ₹{item.price?.toLocaleString("en-IN")} × {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="item-total">
                                                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery & Total Summary */}
                                <div className="shipping-summary-section">
                                    <h4>Delivery Address</h4>
                                    <div className="address-box">
                                        <p className="address-name"><strong>{order.shippingAddress?.fullName}</strong></p>
                                        <p>{order.shippingAddress?.addressLine1}</p>
                                        <p>
                                            {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                                            {order.shippingAddress?.pincode}
                                        </p>
                                        <p className="address-phone">📞 {order.shippingAddress?.phone}</p>
                                    </div>

                                    <div className="amount-breakdown">
                                        <div className="summary-row">
                                            <span>Subtotal</span>
                                            <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Delivery</span>
                                            <span className="free-tag">FREE</span>
                                        </div>
                                        <hr className="summary-divider" />
                                        <div className="summary-row total-row">
                                            <span>Total Paid</span>
                                            <span className="total-highlight">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="success-actions">
                                <Link to="/orders" className="btn-primary">
                                    View My Orders
                                </Link>
                                <Link to="/products" className="btn-secondary">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderSuccess;
