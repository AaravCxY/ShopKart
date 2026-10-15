import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";


const getPopulatedCart = async (userId) => {
    const customer = await Customer.findById(userId).populate({
        path: "cart.product",
        select: "name price image stock category description"
    });
    if (!customer || !customer.cart) return [];
    return customer.cart.filter((item) => item.product !== null);
};

export const addToCart = async (req, res) => {
    try {
        const productId = req.params.productId || req.body.productId;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (product.stock <= 0) {
            return res.status(400).json({
                message: "Product is out of stock"
            });
        }

        if (!req.user.cart) {
            req.user.cart = [];
        }

        const existingItem = req.user.cart.find(
            (item) => item.product.toString() === productId.toString()
        );

        const currentQty = existingItem ? existingItem.quantity : 0;
        const newQty = currentQty + 1;

        if (newQty > product.stock) {
            return res.status(400).json({
                message: `Cannot add more. Only ${product.stock} units available in stock.`
            });
        }

        if (existingItem) {
            existingItem.quantity = newQty;
        } else {
            req.user.cart.push({
                product: productId,
                quantity: 1
            });
        }

        await req.user.save();

        const updatedCart = await getPopulatedCart(req.user._id);

        res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: updatedCart
        });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// GET /cart - Get authenticated user's cart with populated product details
export const getCart = async (req, res) => {
    try {
        const cart = await getPopulatedCart(req.user._id);

        res.status(200).json({
            success: true,
            count: cart.length,
            cart
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// PATCH /cart/:productId - Update item quantity in cart
export const updateQuantity = async (req, res) => {
    try {
        const productId = req.params.productId;
        const { quantity } = req.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            return res.status(400).json({
                message: "Quantity must be at least 1"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (!req.user.cart) {
            req.user.cart = [];
        }

        const item = req.user.cart.find(
            (i) => i.product.toString() === productId.toString()
        );

        if (!item) {
            return res.status(404).json({
                message: "Product not in cart"
            });
        }

        if (parsedQuantity > product.stock) {
            return res.status(400).json({
                message: `Cannot exceed available stock of ${product.stock} units.`
            });
        }

        item.quantity = parsedQuantity;
        await req.user.save();

        const updatedCart = await getPopulatedCart(req.user._id);

        res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: updatedCart
        });
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// DELETE /cart/:productId - Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        if (!req.user.cart) {
            req.user.cart = [];
        }

        const itemIndex = req.user.cart.findIndex(
            (i) => i.product.toString() === productId.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                message: "Product not in cart"
            });
        }

        req.user.cart.splice(itemIndex, 1);
        await req.user.save();

        const updatedCart = await getPopulatedCart(req.user._id);

        res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart: updatedCart
        });
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};
