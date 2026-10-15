import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import api from "../services/api";

// Helper function to dynamically load the Razorpay checkout script in the browser
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        // If already loaded in window
        if (window.Razorpay) {
            return resolve(true);
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function Checkout() {
    const navigate = useNavigate();
    const { cartItems, totalItems, subtotal, clearCart, loading: cartLoading } = useCart();

    // Shipping form state
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        addressLine1: "",
        city: "",
        state: "",
        pincode: ""
    });

    // Validation errors state
    const [formErrors, setFormErrors] = useState({});
    
    // Request & UI states
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState(""); // e.g. "Creating Order...", "Awaiting Payment..."
    const [errorMessage, setErrorMessage] = useState("");

    // 1. Verify user is logged in
    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            try {
                const res = await api.get("/customers/me");
                if (isMounted && res.data) {
                    // Pre-fill full name and phone if customer data is available
                    setFormData((prev) => ({
                        ...prev,
                        fullName: prev.fullName || res.data.fullName || "",
                        phone: prev.phone || res.data.phone || ""
                    }));
                }
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

    // Handle input field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // Clear field-specific error as the user types
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    // Client-side form validation (Task 3)
    const validateForm = () => {
        const errors = {};

        if (!formData.fullName.trim()) {
            errors.fullName = "Full name is required";
        }

        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        } else if (!/^\d{10}$/.test(formData.phone.trim().replace(/[\s-]/g, ""))) {
            errors.phone = "Phone number must be exactly 10 digits";
        }

        if (!formData.addressLine1.trim()) {
            errors.addressLine1 = "Street address is required";
        }

        if (!formData.city.trim()) {
            errors.city = "City is required";
        }

        if (!formData.state.trim()) {
            errors.state = "State is required";
        }

        if (!formData.pincode.trim()) {
            errors.pincode = "Pincode is required";
        } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
            errors.pincode = "Pincode must contain exactly 6 digits";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle checkout & payment flow
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        // Basic client validation
        if (!validateForm()) {
            return;
        }

        if (cartItems.length === 0) {
            setErrorMessage("Your cart is empty. Please add items before checking out.");
            return;
        }

        setIsProcessing(true);
        setProcessStep("Preparing order & payment gateway...");

        try {
            // Load Razorpay script
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                setErrorMessage("Failed to load Razorpay SDK. Please check your internet connection.");
                setIsProcessing(false);
                setProcessStep("");
                return;
            }

            // Step 1: Call Backend to create ShopKart Order & Razorpay Order
            const response = await api.post("/orders/create-payment-order", {
                shippingAddress: {
                    fullName: formData.fullName.trim(),
                    phone: formData.phone.trim().replace(/[\s-]/g, ""),
                    addressLine1: formData.addressLine1.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    pincode: formData.pincode.trim()
                }
            });

            const paymentData = response.data;

            setProcessStep("Opening Razorpay payment window...");

            // Step 2: Configure Razorpay Checkout Options
            const options = {
                key: paymentData.key,
                amount: paymentData.amount,
                currency: paymentData.currency,
                name: "ShopKart",
                description: "Purchase Order #" + paymentData.shopKartOrderId.slice(-6),
                order_id: paymentData.razorpayOrderId,

                // Handler called after successful payment in Razorpay modal
                handler: async function (rzpResponse) {
                    setProcessStep("Verifying payment signature with server...");

                    try {
                        // Step 3: Send payment signature to backend for verification
                        const verifyRes = await api.post("/orders/verify-payment", {
                            shopKartOrderId: paymentData.shopKartOrderId,
                            razorpay_order_id: rzpResponse.razorpay_order_id,
                            razorpay_payment_id: rzpResponse.razorpay_payment_id,
                            razorpay_signature: rzpResponse.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            // Step 4: Clear global cart state and navigate to success page
                            clearCart();
                            navigate(`/order-success/${paymentData.shopKartOrderId}`);
                        } else {
                            setErrorMessage(verifyRes.data.message || "Payment verification failed.");
                            setIsProcessing(false);
                            setProcessStep("");
                        }
                    } catch (verifyErr) {
                        console.error("Verification error:", verifyErr);
                        const msg = verifyErr.response?.data?.message || "Failed to verify payment with server.";
                        setErrorMessage(msg);
                        setIsProcessing(false);
                        setProcessStep("");
                    }
                },

                prefill: {
                    name: formData.fullName,
                    contact: formData.phone
                },

                theme: {
                    color: "#2563eb"
                },

                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        setProcessStep("");
                        setErrorMessage("Payment was cancelled or closed. Your cart remains intact.");
                    }
                }
            };

            const razorpayInstance = new window.Razorpay(options);

            razorpayInstance.on("payment.failed", function (failResponse) {
                console.error("Payment failed:", failResponse.error);
                setErrorMessage(
                    failResponse.error?.description ||
                    "Payment failed. Your cart has not been cleared. Please try again."
                );
                setIsProcessing(false);
                setProcessStep("");
            });

            razorpayInstance.open();
        } catch (err) {
            console.error("Order creation error:", err);
            const msg = err.response?.data?.message || "Could not process order. Please try again.";
            setErrorMessage(msg);
            setIsProcessing(false);
            setProcessStep("");
        }
    };

    if (cartLoading) {
        return (
            <div>
                <Navbar />
                <div className="page">
                    <div className="cart-state-box">
                        <div className="spinner">⏳</div>
                        <p>Loading checkout...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!cartLoading && cartItems.length === 0) {
        return (
            <div>
                <Navbar />
                <div className="page cart-page">
                    <div className="cart-state-box empty-box">
                        <div className="empty-cart-icon">🛒</div>
                        <h2>Your cart is empty</h2>
                        <p className="empty-subtitle">Add some products to your cart before proceeding to checkout.</p>
                        <Link to="/products" className="btn-primary browse-btn">
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="page checkout-page">
                <div className="cart-header">
                    <h2>Checkout</h2>
                    <p className="cart-count-subtitle">Please enter your shipping address and review your order</p>
                </div>

                {errorMessage && (
                    <div className="error-banner">
                        <p>⚠️ {errorMessage}</p>
                    </div>
                )}

                <div className="checkout-layout">
                    {/* Left Side: Shipping Address Form */}
                    <div className="checkout-form-container">
                        <form onSubmit={handlePlaceOrder} noValidate>
                            <div className="form-section-card">
                                <h3>📦 Shipping Details</h3>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="fullName">Full Name *</label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            placeholder="e.g. Aarav Sharma"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className={formErrors.fullName ? "input-error" : ""}
                                            disabled={isProcessing}
                                        />
                                        {formErrors.fullName && (
                                            <span className="error-text">{formErrors.fullName}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number *</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            placeholder="10-digit mobile number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={formErrors.phone ? "input-error" : ""}
                                            disabled={isProcessing}
                                        />
                                        {formErrors.phone && (
                                            <span className="error-text">{formErrors.phone}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="addressLine1">Street Address / House No. *</label>
                                    <input
                                        type="text"
                                        id="addressLine1"
                                        name="addressLine1"
                                        placeholder="e.g. 22 MG Road, Flat 402"
                                        value={formData.addressLine1}
                                        onChange={handleChange}
                                        className={formErrors.addressLine1 ? "input-error" : ""}
                                        disabled={isProcessing}
                                    />
                                    {formErrors.addressLine1 && (
                                        <span className="error-text">{formErrors.addressLine1}</span>
                                    )}
                                </div>

                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label htmlFor="city">City *</label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            placeholder="e.g. Bengaluru"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className={formErrors.city ? "input-error" : ""}
                                            disabled={isProcessing}
                                        />
                                        {formErrors.city && (
                                            <span className="error-text">{formErrors.city}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="state">State *</label>
                                        <input
                                            type="text"
                                            id="state"
                                            name="state"
                                            placeholder="e.g. Karnataka"
                                            value={formData.state}
                                            onChange={handleChange}
                                            className={formErrors.state ? "input-error" : ""}
                                            disabled={isProcessing}
                                        />
                                        {formErrors.state && (
                                            <span className="error-text">{formErrors.state}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="pincode">Pincode *</label>
                                        <input
                                            type="text"
                                            id="pincode"
                                            name="pincode"
                                            placeholder="6-digit pincode"
                                            maxLength="6"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            className={formErrors.pincode ? "input-error" : ""}
                                            disabled={isProcessing}
                                        />
                                        {formErrors.pincode && (
                                            <span className="error-text">{formErrors.pincode}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary place-order-btn"
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <span>⏳ {processStep || "Processing Order..."}</span>
                                ) : (
                                    <span>💳 Place Order & Pay ₹{subtotal.toLocaleString("en-IN")}</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right Side: Order Review Summary */}
                    <div className="order-summary-box checkout-summary-box">
                        <h3>Order Summary</h3>
                        <div className="checkout-items-list">
                            {cartItems.map((item) => {
                                const prod = item.product;
                                if (!prod) return null;
                                return (
                                    <div key={prod._id} className="checkout-item-preview">
                                        <img src={prod.image} alt={prod.name} className="checkout-item-thumb" />
                                        <div className="checkout-item-info">
                                            <p className="checkout-item-name">{prod.name}</p>
                                            <p className="checkout-item-qty">
                                                Qty: {item.quantity} × ₹{prod.price?.toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                        <p className="checkout-item-subtotal">
                                            ₹{((prod.price || 0) * item.quantity).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-row">
                            <span>Items ({totalItems})</span>
                            <span>₹{subtotal.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="summary-row">
                            <span>Delivery</span>
                            <span className="free-tag">FREE</span>
                        </div>
                        <div className="summary-row">
                            <span>Payment Method</span>
                            <span className="payment-tag">Razorpay</span>
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-row total-row">
                            <span>Total Payable</span>
                            <span>₹{subtotal.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="secure-badge">
                            <span>100% Safe & Secure Test Payment</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;
