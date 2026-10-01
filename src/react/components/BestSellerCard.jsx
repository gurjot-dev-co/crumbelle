import { useState } from "react";

function BestSellerCard({product}) {
    const {favouriteAdded, setFavouriteAdded} = useState(false);

    async function handleFavourite(event) {
        event.preventDefault();
        event.stopPropagation();
        try {
            const response = await fetch(`/api/favourites`, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify({
                    productId : product.id
                })
            });
            const data = await response.json();
            if (!response.ok) {
                if (response === 401) return window.location.href = "/login";
                throw new Error(data.error || "Unable to add favourite"); 
            }
            setFavouriteAdded(true);
            setTimeout(() => {
                setFavouriteAdded(false);
            }, 1000);
        } catch (error) {
            console.error("Error adding favourite : ", error);
        }
    }

    function goToProductPage(event) {
        event.preventDefault();
        window.location.href = `/product/${product.id}`    
    }
    return (
         <a href={"/product/" + product.id} className="product-card">
            <div className="product-image">
                <img src={product.image} alt={product.name} height="280px" />
                <span className="best-seller-badge">Best Seller</span>
                <button className="wishlist-button" type="button" aria-label={`Add ${product.name} to wishlist`} onClick={handleFavourite}>
                    <i className={favouriteAdded ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                </button>
            </div>
            <div className="product-info">
                <span className="product-category">{product.category_name}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-bottom">
                    <div className="product-price-row">
                        <p className="product-price">
                            ₹{Number(product.price).toLocaleString("en-IN")}
                        </p>
                        {product.weight != null && (
                            <span className="product-weight">
                                {product.weight} g
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

export default BestSellerCard;