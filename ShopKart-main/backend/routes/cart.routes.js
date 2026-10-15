import express from "express";
import {
    addToCart,
    getCart,
    updateQuantity,
    removeFromCart
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all cart endpoints with auth middleware
router.use(protect);

router.post("/", addToCart);
router.post("/:productId", addToCart);
router.get("/", getCart);
router.patch("/:productId", updateQuantity);
router.delete("/:productId", removeFromCart);

export default router;
