import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductCard({ product, isInitiallySaved = false, onWishlistToggle }) {
    const navigate = useNavigate();
    const { addToCart, cartItems } = useCart();

    const [savingWishlist, setSavingWishlist] = useState(false);
    const [saved, setSaved] = useState(isInitiallySaved);
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartSuccess, setCartSuccess] = useState(false);
    const [feedback, setFeedback] = useState("");

    const existingCartItem = cartItems.find(
        (item) => item.product?._id === product._id
    );
    const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;

    const viewDetails = () => {
        navigate("/products/" + product._id);
    };

    const handleWishlistClick = async () => {
        if (savingWishlist) return;

        setSavingWishlist(true);
        setFeedback("");

        try {
            if (saved) {
                await api.delete("/wishlist/" + product._id);
                setSaved(false);
                if (onWishlistToggle) onWishlistToggle(product._id, false);
            } else {
                await api.post("/wishlist/" + product._id);
                setSaved(true);
                if (onWishlistToggle) onWishlistToggle(product._id, true);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setFeedback("Please login to save to wishlist.");
            } else if (err.response?.status === 409) {
                setSaved(true);
            } else if (err.response?.data?.message) {
                setFeedback(err.response.data.message);
            } else {
                setFeedback("Unable to save product. Please try again.");
            }
        } finally {
            setSavingWishlist(false);
        }
    };

    const handleAddToCart = async () => {
        if (addingToCart) return;

        if (product.stock <= 0) {
            setFeedback("Product is out of stock.");
            return;
        }

        if (currentCartQty >= product.stock) {
            setFeedback(`Max available stock (${product.stock}) already in cart.`);
            setTimeout(() => setFeedback(""), 3000);
            return;
        }

        setAddingToCart(true);
        setFeedback("");

        const result = await addToCart(product._id);
        if (result.success) {
            setCartSuccess(true);
            setTimeout(() => setCartSuccess(false), 2000);
        } else {
            if (result.status === 401) {
                navigate("/login");
            } else {
                setFeedback(result.message);
                setTimeout(() => setFeedback(""), 3000);
            }
        }
        setAddingToCart(false);
    };

    return (
        <div className="product-card">
            <div className="product-card-img-container">
                <img src={product.image} alt={product.name} />
                <button
                    type="button"
                    className={`wishlist-corner-btn ${saved ? "saved" : ""}`}
                    onClick={handleWishlistClick}
                    disabled={savingWishlist}
                    title={saved ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                    {savingWishlist ? "⏳" : saved ? "❤️" : "♡"}
                </button>
            </div>
            <h3>{product.name}</h3>
            <p className="product-category">{product.category}</p>
            <p className="product-price">₹{product.price?.toLocaleString("en-IN") || product.price}</p>
            <p className="product-stock">
                {product.stock > 0 ? `${product.stock} units left` : "Out of stock"}
            </p>

            {feedback && <p className="card-feedback error">{feedback}</p>}

            <div className="product-card-actions">
                <button
                    type="button"
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock <= 0}
                >
                    {addingToCart
                        ? "Adding..."
                        : cartSuccess
                        ? "✓ Added to Cart"
                        : currentCartQty > 0
                        ? `Add Another (${currentCartQty} in cart)`
                        : "Add to Cart"}
                </button>
                <button type="button" className="btn-details" onClick={viewDetails}>
                    View Details
                </button>
                <button
                    type="button"
                    className={`btn-wishlist ${saved ? "saved" : ""}`}
                    onClick={handleWishlistClick}
                    disabled={savingWishlist}
                >
                    {savingWishlist
                        ? "⏳ Saving..."
                        : saved
                        ? "♥ Added to Wishlist"
                        : "♡ Add to Wishlist"}
                </button>
            </div>
        </div>
    );
}

export default ProductCard;
