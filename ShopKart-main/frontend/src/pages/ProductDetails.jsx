
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductDetails() {
    const { id, price } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);

    const existingCartItem = cartItems.find(
        (item) => item.product?._id === id
    );

    const currentCartQty = existingCartItem
        ? existingCartItem.quantity
        : 0;

    useEffect(() => {
        let isMounted = true;

        const loadDetails = async () => {
            setLoading(true);
            setError("");

            try {
                // Check whether the user is logged in
                await api.get("/customers/me");

                // Fetch the actual product using its ID
                const response = await api.get("/products/" + id);

                if (isMounted) {
                    setProduct(response.data);
                }

                // Fetch wishlist
                const wishRes = await api.get("/wishlist");

                if (
                    isMounted &&
                    wishRes.data &&
                    Array.isArray(wishRes.data.wishlist)
                ) {
                    const found = wishRes.data.wishlist.some(
                        (item) => item._id === id
                    );

                    setIsWishlisted(found);
                }
            } catch (err) {
                if (isMounted) {
                    if (err.response?.status === 401) {
                        navigate("/login");
                        return;
                    }

                    setError(
                        err.response?.data?.message ||
                        "Something went wrong while loading product details."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDetails();

        return () => {
            isMounted = false;
        };
    }, [id, navigate]);

    const handleAddToCart = async () => {
        if (!product || addingToCart) return;

        if (product.stock <= 0) {
            setMessage("Product is out of stock.");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        if (currentCartQty >= product.stock) {
            setMessage(
                `Max available stock (${product.stock}) already in cart.`
            );
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        setAddingToCart(true);
        setMessage("");

        try {
            const result = await addToCart(product._id);

            if (result.success) {
                setMessage("Item added to cart! 🛒");
            } else if (result.status === 401) {
                navigate("/login");
            } else {
                setMessage(result.message || "Failed to add item to cart.");
            }
        } catch (err) {
            setMessage("Failed to add item to cart.");
        } finally {
            setAddingToCart(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleWishlistToggle = async () => {
        if (wishlistLoading) return;

        setWishlistLoading(true);
        setMessage("");

        try {
            if (isWishlisted) {
                await api.delete("/wishlist/" + id);
                setIsWishlisted(false);
                setMessage("Removed from Wishlist");
            } else {
                await api.post("/wishlist/" + id);
                setIsWishlisted(true);
                setMessage("Added to Wishlist ❤️");
            }
        } catch (err) {
            if (err.response?.status === 401) {
                navigate("/login");
            } else {
                setMessage(
                    err.response?.data?.message ||
                    "Failed to update wishlist."
                );
            }
        } finally {
            setWishlistLoading(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    return (
        <div>
            <Navbar />

            <div className="page product-details-page">
                {loading && (
                    <p className="loading-text">
                        Loading product details...
                    </p>
                )}

                {!loading && error !== "" && (
                    <p className="error">{error}</p>
                )}

                {!loading && error === "" && product === null && (
                    <p className="no-products">No product found.</p>
                )}

                {!loading && error === "" && product !== null && (
                    <div className="details-box">
                        <div className="details-img-container">
                            <img
                                src={product.image}
                                alt={product.name}
                            />
                        </div>

                        <div className="details-content">
                            <h2>{product.name}</h2>

                            <p className="details-description">
                                {product.description}
                            </p>

                            <p className="details-category">
                                Category: <strong>{product.category}</strong>
                            </p>

                            <p className="details-price">
                                Price:{" "}
                                <strong>
                                    ₹{Number(product.price).toLocaleString("en-IN")}
                                </strong>
                            </p>

                            <p className="details-stock">
                                Stock:{" "}
                                <strong>
                                    {product.stock > 0
                                        ? `${product.stock} units left`
                                        : "Out of stock"}
                                </strong>
                            </p>

                            <div className="details-actions">
                                <button
                                    type="button"
                                    className="btn-primary btn-add-cart-large"
                                    onClick={handleAddToCart}
                                    disabled={
                                        addingToCart || product.stock <= 0
                                    }
                                >
                                    {addingToCart
                                        ? "Adding..."
                                        : currentCartQty > 0
                                        ? `Add Another (${currentCartQty} in cart)`
                                        : "Add to Cart"}
                                </button>

                                <button
                                    type="button"
                                    className={`btn-wishlist ${
                                        isWishlisted ? "saved" : ""
                                    }`}
                                    onClick={handleWishlistToggle}
                                    disabled={wishlistLoading}
                                >
                                    {wishlistLoading
                                        ? "⏳ Saving..."
                                        : isWishlisted
                                        ? "♥ Remove from Wishlist"
                                        : "♡ Add to Wishlist"}
                                </button>
                            </div>

                            {message !== "" && (
                                <p
                                    className={`action-message ${
                                        message.includes("Cannot") ||
                                        message.includes("Max") ||
                                        message.toLowerCase().includes("out of") ||
                                        message.includes("Failed")
                                            ? "error"
                                            : "success"
                                    }`}
                                >
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductDetails;
