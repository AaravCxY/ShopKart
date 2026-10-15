import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Customer from "../models/customer.model.js";
import razorpay from "../config/razorpay.js";

// ==========================================

export const createPaymentOrder = async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        // 1. Validate shipping address fields
        if (!shippingAddress) {
            return res.status(400).json({
                message: "Shipping address is required"
            });
        }

        const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

        if (
            !fullName?.trim() ||
            !phone?.trim() ||
            !addressLine1?.trim() ||
            !city?.trim() ||
            !state?.trim() ||
            !pincode?.trim()
        ) {
            return res.status(400).json({
                message: "All shipping address fields are required and cannot be blank"
            });
        }

        // Validate phone format (10 digits)
        const phoneClean = phone.trim().replace(/[\s-]/g, "");
        if (!/^\d{10}$/.test(phoneClean)) {
            return res.status(400).json({
                message: "Phone number must be a valid 10-digit number"
            });
        }

        // Validate pincode format (6 digits)
        const pincodeClean = pincode.trim();
        if (!/^\d{6}$/.test(pincodeClean)) {
            return res.status(400).json({
                message: "Pincode must contain exactly 6 digits"
            });
        }

        // 2. Load user's cart from database
        const customer = await Customer.findById(req.user._id);
        if (!customer || !customer.cart || customer.cart.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty. Add products before checking out."
            });
        }

        // 3. Verify stock and calculate fresh total using current Product collection data
        const orderItems = [];
        let serverCalculatedTotal = 0;

        for (const cartItem of customer.cart) {
            const product = await Product.findById(cartItem.product);

            // Product might have been deleted from DB
            if (!product) {
                return res.status(400).json({
                    message: "One or more items in your cart are no longer available"
                });
            }

            // Stock check
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}. Only ${product.stock} available, but you requested ${cartItem.quantity}.`
                });
            }

            // Build purchase snapshot (name and price fixed at purchase time)
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                image: product.image
            });

            serverCalculatedTotal += product.price * cartItem.quantity;
        }

        if (serverCalculatedTotal <= 0) {
            return res.status(400).json({
                message: "Invalid order amount"
            });
        }

        // 4. Create pending ShopKart order in database
        const shopKartOrder = new Order({
            user: req.user._id,
            items: orderItems,
            shippingAddress: {
                fullName: fullName.trim(),
                phone: phoneClean,
                addressLine1: addressLine1.trim(),
                city: city.trim(),
                state: state.trim(),
                pincode: pincodeClean
            },
            totalAmount: serverCalculatedTotal,
            paymentStatus: "PENDING",
            status: "PENDING_PAYMENT"
        });

        await shopKartOrder.save();

        // 5. Create Razorpay order (Razorpay expects amount in smallest currency unit: paise)
        const amountInPaise = Math.round(serverCalculatedTotal * 100);

        let razorpayOrderId = null;
        try {
            const razorpayOrder = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: shopKartOrder._id.toString()
            });
            razorpayOrderId = razorpayOrder.id;
        } catch (rzpErr) {
            console.error("Razorpay order creation error:", rzpErr);
            // If Razorpay API fails (e.g. invalid test keys in development), provide meaningful message
            return res.status(502).json({
                message: "Failed to initiate payment gateway. Please check Razorpay keys."
            });
        }

        // Save Razorpay order ID in our database order
        shopKartOrder.razorpayOrderId = razorpayOrderId;
        await shopKartOrder.save();

        // 6. Return order and payment config (Never send RAZORPAY_KEY_SECRET!)
        return res.status(201).json({
            success: true,
            shopKartOrderId: shopKartOrder._id,
            razorpayOrderId: razorpayOrderId,
            amount: amountInPaise,
            currency: "INR",
            key: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder"
        });
    } catch (error) {
        console.error("Error creating payment order:", error);
        return res.status(500).json({
            message: "Internal server error while creating order"
        });
    }
};

// ==========================================
// 2. POST /orders/verify-payment
// ==========================================
// - Verifies HMAC SHA256 payment signature from Razorpay
// - Marks order as PAID & PLACED
// - Deducts stock for purchased items
// - Clears the user's cart ONLY upon verified payment
export const verifyPayment = async (req, res) => {
    try {
        const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification parameters"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // Find the pending order
        const order = await Order.findById(shopKartOrderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Enforce user ownership
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not own this order"
            });
        }

        // Generate expected signature using trusted order.razorpayOrderId from our DB
        const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
        const body = order.razorpayOrderId + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        // Validate signature
        if (expectedSignature !== razorpay_signature) {
            // Invalid signature: mark payment as failed, do NOT clear cart
            order.paymentStatus = "FAILED";
            await order.save();

            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Signature is valid! Update order status
        order.paymentStatus = "PAID";
        order.status = "PLACED";
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        // Deduct purchased item stock from database
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        // Clear the user's cart in database
        const customer = await Customer.findById(req.user._id);
        if (customer) {
            customer.cart = [];
            await customer.save();
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified and order placed successfully",
            order
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during payment verification"
        });
    }
};

// ==========================================
// 3. GET /orders
// ==========================================
// - Returns all orders belonging to authenticated user
// - Sorted newest first
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({
            message: "Server error while fetching orders"
        });
    }
};

// ==========================================
// 4. GET /orders/:id
// ==========================================
// - Returns single order by ID
// - Validates order ownership
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid order ID format"
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Verify ownership
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to view this order"
            });
        }

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return res.status(500).json({
            message: "Server error while fetching order"
        });
    }
};

// ==========================================
// 5. PATCH /orders/:id/status (Bonus Challenge)
// ==========================================
// - Allows progressing order status (PLACED -> CONFIRMED -> SHIPPED -> DELIVERED)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        order.status = status;
        await order.save();

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({
            message: "Server error while updating order status"
        });
    }
};
export const getOrderPriceById = async (req, res) => {
    try {const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }
        const order = await Order.findById(id);
      
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        
        res.status(200).json({
            price: order.totalAmount ?? order.price
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};