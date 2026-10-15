import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
    createPaymentOrder,
    verifyPayment,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getOrderPriceById
} from "../controllers/order.controller.js";

const router = express.Router();

// 1. Create pending order & Razorpay order
router.post("/create-payment-order", protect, createPaymentOrder);
// 2. Verify Razorpay signature & finalize order
router.post("/verify-payment", protect, verifyPayment);

// 3. Get all orders of current logged in user
router.get("/", protect, getMyOrders);

// 4. Get single order details
router.get("/:id", protect, getOrderById);

// Get order price by id
router.get("/:id/price", getOrderPriceById);

// 5. Update order status (Bonus challenge)
router.patch("/:id/status", protect, updateOrderStatus);

export default router;
