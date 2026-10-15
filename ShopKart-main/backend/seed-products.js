import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.model.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const products = [
    {
        name: "Mechanical Keyboard",
        description: "RGB mechanical keyboard with tactile blue switches and customizable backlighting.",
        price: 2999,
        category: "Electronics",
        image: "https://picsum.photos/seed/keyboard/400/300",
        stock: 15
    },
    {
        name: "Noise Cancelling Headphones",
        description: "Wireless over-ear headphones with active noise cancellation and 30-hour battery life.",
        price: 4999,
        category: "Electronics",
        image: "https://picsum.photos/seed/headphones/400/300",
        stock: 25
    },
    {
        name: "Smart Fitness Watch",
        description: "Fitness tracker with heart rate monitor, sleep tracking, and AMOLED display.",
        price: 3499,
        category: "Electronics",
        image: "https://picsum.photos/seed/smartwatch/400/300",
        stock: 20
    },
    {
        name: "Wireless Gaming Mouse",
        description: "Ergonomic gaming mouse with ultra-fast sensor and customizable DPI settings.",
        price: 1499,
        category: "Electronics",
        image: "https://picsum.photos/seed/mouse/400/300",
        stock: 30
    },
    {
        name: "4K Ultra HD Monitor",
        description: "27-inch 4K IPS monitor with HDR support and ultra-slim bezels.",
        price: 15999,
        category: "Electronics",
        image: "https://picsum.photos/seed/monitor/400/300",
        stock: 8
    },
    {
        name: "Cotton T-Shirt",
        description: "100% premium breathable cotton t-shirt for daily comfort.",
        price: 599,
        category: "Fashion",
        image: "https://picsum.photos/seed/tshirt/400/300",
        stock: 50
    },
    {
        name: "Running Shoes",
        description: "Lightweight cushioned sneakers for high-performance running and daily walking.",
        price: 2499,
        category: "Fashion",
        image: "https://picsum.photos/seed/shoes/400/300",
        stock: 18
    },
    {
        name: "Classic Denim Jacket",
        description: "Stylish slim-fit denim jacket with durable stitching and chest pockets.",
        price: 1999,
        category: "Fashion",
        image: "https://picsum.photos/seed/jacket/400/300",
        stock: 12
    },
    {
        name: "Genuine Leather Wallet",
        description: "Compact RFID-blocking genuine leather bi-fold wallet for men.",
        price: 899,
        category: "Fashion",
        image: "https://picsum.photos/seed/wallet/400/300",
        stock: 35
    },
    {
        name: "JavaScript & Node.js Guide",
        description: "A comprehensive guide to mastering modern JavaScript and backend development.",
        price: 499,
        category: "Books",
        image: "https://picsum.photos/seed/jsbook/400/300",
        stock: 40
    },
    {
        name: "Data Structures & Algorithms",
        description: "Essential textbook covering fundamental algorithms, problem-solving, and code optimization.",
        price: 699,
        category: "Books",
        image: "https://picsum.photos/seed/dsa/400/300",
        stock: 22
    },
    {
        name: "Minimalist Table Lamp",
        description: "Dimmable warm LED table lamp with wooden base for study and bedroom.",
        price: 899,
        category: "Home",
        image: "https://picsum.photos/seed/lamp/400/300",
        stock: 15
    },
    {
        name: "Ergonomic Office Chair",
        description: "Mesh high-back desk chair with lumbar support and adjustable armrests.",
        price: 7999,
        category: "Home",
        image: "https://picsum.photos/seed/chair/400/300",
        stock: 10
    },
    {
        name: "Stainless Steel Water Bottle",
        description: "Insulated 1-liter eco-friendly thermal flask keeping water cold for 24 hours.",
        price: 499,
        category: "Fitness",
        image: "https://picsum.photos/seed/bottle/400/300",
        stock: 45
    },
    {
        name: "Anti-Slip Yoga Mat",
        description: "Extra thick non-slip exercise yoga mat with carrying strap.",
        price: 799,
        category: "Fitness",
        image: "https://picsum.photos/seed/yogamat/400/300",
        stock: 28
    }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log("Successfully seeded 15 products into the database!");
        await mongoose.disconnect();
    })
    .catch((err) => {
        console.log("Seeding error:", err);
    });
