import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import api from "../services/api";

function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [wishlistIds, setWishlistIds] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Auth check & load wishlist items for current user
    useEffect(() => {
        let isMounted = true;
        const checkAuthAndWishlist = async () => {
            try {
                // Ensure user is authenticated
                await api.get("/customers/me");

                // Get wishlist
                const response = await api.get("/wishlist");
                if (isMounted && response.data && Array.isArray(response.data.wishlist)) {
                    setWishlistIds(response.data.wishlist.map((item) => item._id));
                }
            } catch (err) {
                if (isMounted) {
                    navigate("/login");
                }
            }
        };

        checkAuthAndWishlist();
        return () => {
            isMounted = false;
        };
    }, [navigate]);

    useEffect(() => {
        const getProducts = async () => {
            setLoading(true);
            setError("");

            try {
                const params = {};

                if (search !== "") {
                    params.search = search;
                }

                if (category !== "") {
                    params.category = category;
                }

                const response = await api.get("/products", {
                    params: params
                });

                setProducts(response.data.products || []);
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate("/login");
                    return;
                }
                setError("Something went wrong while loading products.");
            } finally {
                setLoading(false);
            }
        };

        getProducts();
    }, [search, category, navigate]);

    const handleWishlistToggle = (productId, isSaved) => {
        if (isSaved) {
            setWishlistIds((prev) => [...prev, productId]);
        } else {
            setWishlistIds((prev) => prev.filter((id) => id !== productId));
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page">
                <h2>Products</h2>

                <SearchBar
                    search={search}
                    setSearch={setSearch}
                    category={category}
                    setCategory={setCategory}
                />

                {loading && <p className="loading-text">Loading products...</p>}

                {!loading && error !== "" && <p className="error">{error}</p>}

                {!loading && error === "" && products.length === 0 && (
                    <p className="no-products">No products found.</p>
                )}

                {!loading && error === "" && (
                    <div className="product-list">
                        {products.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                isInitiallySaved={wishlistIds.includes(product._id)}
                                onWishlistToggle={handleWishlistToggle}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Products;
