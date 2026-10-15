import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

export const addToWishlist = async (req, res) => {
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

        if (!req.user.wishlist) {
            req.user.wishlist = [];
        }

        const isAlreadyInWishlist = req.user.wishlist.some(
            (id) => id.toString() === productId.toString()
        );

        if (isAlreadyInWishlist) {
            return res.status(409).json({
                message: "Product already in wishlist"
            });
        }

        // Add product ObjectId reference
        req.user.wishlist.push(productId);
        await req.user.save();

        res.status(201).json({
            success: true,
            message: "Product added to wishlist"
        });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user._id).populate({
            path: "wishlist",
            select: "name price category image stock description"
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        // Filter out any null entries if a product was deleted from DB
        const validWishlist = (customer.wishlist || []).filter((item) => item !== null);

        res.status(200).json({
            success: true,
            count: validWishlist.length,
            wishlist: validWishlist
        });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        if (!req.user.wishlist) {
            req.user.wishlist = [];
        }

        const isPresent = req.user.wishlist.some(
            (id) => id.toString() === productId.toString()
        );

        if (!isPresent) {
            return res.status(404).json({
                message: "Product not in wishlist"
            });
        }

        // Remove the product reference
        req.user.wishlist = req.user.wishlist.filter(
            (id) => id.toString() !== productId.toString()
        );

        await req.user.save();

        res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

export const toggleWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;

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

        if (!req.user.wishlist) {
            req.user.wishlist = [];
        }

        const isPresent = req.user.wishlist.some(
            (id) => id.toString() === productId.toString()
        );

        if (isPresent) {
            req.user.wishlist = req.user.wishlist.filter(
                (id) => id.toString() !== productId.toString()
            );
            await req.user.save();
            return res.status(200).json({
                success: true,
                saved: false,
                message: "Product removed from wishlist"
            });
        } else {
            req.user.wishlist.push(productId);
            await req.user.save();
            return res.status(200).json({
                success: true,
                saved: true,
                message: "Product added to wishlist"
            });
        }
    } catch (error) {
        console.error("Error toggling wishlist:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};
