import {useEffect, useState} from "react";

export default function ProductPage ( {productId} ) {
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [ingredientsOpen, setIngredientsOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [addingToCart, setAddingToCart] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");

    useEffect(() => {
        async function fetchProduct() {
            try {
                console.log("Product id : ", productId);
                console.log("API URL : /api/products/", productId );
                const response = await fetch(`/api/products/${productId}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Unable to load product.");
                setProduct(data.product);
            } catch (error) {
                console.error("Error fetching product : ", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProduct();
    }, [productId]);

    async function handleAddToCart() {
        setAddingToCart(true);
        setCartAdded(false);
        setCartMessage("");
        setCartError("");
        const startTime = Date.now();
        try {
            const response = await fetch(`/api/cart`, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({
                    productId : product.id,
                    quantity: quantity
                })
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401) return window.location.href = "/login";
                throw new Error(data.error || "Unable to add item to cart.");
            }
            setCartMessage(data.message);
            
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(1000 - elapsedTime, 0);

            setTimeout(() => {
                setAddingToCart(false);
                setCartAdded(true);
                setTimeout(() => {
                    setCartAdded(false);
                }, 300);
            }, remainingTime);
        } catch (error) {
            console.error("Error adding to cart : ", error);
            setCartError(error.message);
            setAddingToCart(false);
        } 
    }

    if (loading) {
        return (
            <main className="product-page">
                <div className="product-container">
                    <p className="product-loading">Loading product...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="product-page">
                <div className="product-container">
                    <p className="product-error">{error}</p>
                </div>
            </main>
        )
    }

    if (!product) {
        return null;
    }

    return (
        <main className="product-page">
            <div className="product-container">

                <div className="product-image-section">
                    <img src={product.image} alt={product.name} className="main-product-image"/>
                </div>

                <div className="main-product-info">
                    <h3 className="main-product-name">{product.name}</h3>
                    {/* <p className="main-product-price">₹{Number(product.price).toLocaleString("en-IN")}</p> */}

                    <div className="main-product-price-row">
                        <p className="main-product-price">
                            ₹{Number(product.price).toLocaleString("en-IN")}
                        </p>

                        {product.weight != null && (
                            <span className="main-product-weight">
                                {product.weight} g
                            </span>
                        )}
                    </div>

                    <p className="main-product-description">{product.description}</p>

                    <div className="product-quantity">
                        <label htmlFor="product-quantity" className="quantity-label">Quantity</label>
                        <select className="quantity-select" id="product-quantity" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
                            {Array.from( {length: 20}, (_, index) => index + 1 ).map((number) => (
                                <option key={number} value={number}>{number}</option>
                            ))}
                        </select>
                    </div>

                    <button type="button" className="main-add-to-cart-button" onClick={handleAddToCart} disabled={addingToCart || cartAdded}>{addingToCart ? "Adding..." : cartAdded ? "Added ✓" : "Add to Cart"}</button>
                    {cartMessage && (
                        <p className="cart-success">{cartMessage}</p>
                    )}
                    {cartError && (
                        <p className="cart-error">{cartError}</p>
                    )}
                    <div className="product-information-section">

                        <button type="button" className="product-information-header" onClick={() => setDetailsOpen(!detailsOpen)}>
                            <span>Product Details</span>
                            <span className={`accordian-icon ${detailsOpen ? "open" : ""}`}>+</span>
                        </button>

                        {detailsOpen && (
                            <div className="product-information-content">
                                <ul>
                                    {product.details?.map((detail, index) => (
                                        <li key={index}>{detail}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <button type="button" className="product-information-header" onClick={() => setIngredientsOpen(!ingredientsOpen)} aria-expanded={ingredientsOpen}>
                        <span>Ingredients</span>
                        <span className={`accordian-icon ${ingredientsOpen? "open" : ""}`}>+</span>
                    </button>

                    {ingredientsOpen && (
                        <div className="product-information-content">
                            <ul>
                                {product.ingredients?.map((ingredient, index) => (
                                    <li key={index}>{ingredient}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

            </div>
        </main>
    )
}