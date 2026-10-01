import { useState, useEffect } from "react";

function ProductCard({product}) {
    const [isFavourite, setIsFavourite] = useState(
        Boolean(product.is_favourite)
    );
    const [favouriteLoading, setFavouriteLoading] = useState(false);

    useEffect(() => {
        setIsFavourite(Boolean(product.is_favourite));
    }, [product.is_favourite]);

    async function handleFavourite(event) {
        event.preventDefault();
        event.stopPropagation();
        if (favouriteLoading) return;
        setFavouriteLoading(true);
        try {
            let response;
            if (isFavourite) {
                // remove favourite
                response = await fetch(`/api/favourites/${product.id}`, {
                        method: "DELETE"
                    }
                );
            } else {
                // add favourite
                response = await fetch("/api/favourites", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        productId: product.id
                    })
                });
            }
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401) return window.location.href = "/login";
                throw new Error(data.error || "Unable to update favourite.");
            }
            setIsFavourite((previous) => !previous);
        } catch (error) {
            console.error("Error updating favourite:", error);
        } finally {
            setFavouriteLoading(false);
        }
    }


    function goToProductPage(event) {
        event.preventDefault();
        window.location.href = `/product/${product.id}`
    }
    return ( 
        <a href={`/product/${product.id}`} className="product-card">

            <div className="product-image">
                <img src={product.image} alt={product.name} />
                <button className={`wishlist-button ${isFavourite ? "favourite-active" : "" }`} type="button" aria-label={isFavourite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} 
                aria-pressed={isFavourite} disabled={favouriteLoading} onClick={handleFavourite} >
                    <i className={isFavourite ? "fa-solid fa-heart" : "fa-regular fa-heart"} ></i>
                </button>
                {product.is_best_seller && (
                    <span className="best-seller-badge">BEST SELLER</span>
                )}
            </div>

            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-bottom">
                    <div className="product-price-row">
                        <p className="product-price">
                            ₹{Number(product.price).toLocaleString("en-IN")}
                        </p>
                        {product.weight != null && (
                            <span className="product-weight">
                                {product.weight} gm
                            </span>
                        )}
                    </div>

                    <button className= "add-to-cart-button" type="button" disabled={!product.is_available} onClick={goToProductPage}>
                        {!product.is_available ? "Unavailable" : "Add to Cart"}
                    </button>
                </div>
            </div>

        </a>
    )
}

export default ProductCard;