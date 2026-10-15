import { createContext, useContext, useEffect, useState, useMemo } from "react";
import api from "../services/api";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCart = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/cart");
            setCartItems(response.data.cart || []);
        } catch (err) {
            if (err.response?.status === 401) {
                setCartItems([]);
            } else {
                setError("Unable to load cart.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // Derived cart totals
    const totalItems = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
    }, [cartItems]);

    const subtotal = useMemo(() => {
        return cartItems.reduce(
            (acc, item) => acc + ((item.product?.price || 0) * (item.quantity || 0)),
            0
        );
    }, [cartItems]);

    const addToCart = async (productId) => {
        try {
            const response = await api.post("/cart/" + productId);
            if (response.data?.cart) {
                setCartItems(response.data.cart);
            }
            return { success: true, message: response.data?.message || "Added to cart" };
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to add to cart";
            return { success: false, message: msg, status: err.response?.status };
        }
    };

    const updateQuantity = async (productId, quantity) => {
        try {
            const response = await api.patch("/cart/" + productId, { quantity });
            if (response.data?.cart) {
                setCartItems(response.data.cart);
            }
            return { success: true, message: response.data?.message || "Cart updated" };
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update quantity";
            return { success: false, message: msg, status: err.response?.status };
        }
    };

    const removeFromCart = async (productId) => {
        try {
            const response = await api.delete("/cart/" + productId);
            if (response.data?.cart) {
                setCartItems(response.data.cart);
            }
            return { success: true, message: response.data?.message || "Removed from cart" };
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to remove item";
            return { success: false, message: msg, status: err.response?.status };
        }
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        totalItems,
        subtotal,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart: fetchCart,
        clearCart
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
