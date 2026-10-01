import { useState, useEffect } from "react";

export default function FavouritesPage() {
    const [favourites, setFavourites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchFavourties() {
            try {
                const response = await fetch("/api/favourites");
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 401) return window.location.href = "/login";
                    throw new Error(data.error || "Unable to load your favourites.");
                }
                setFavourites(data.favourites);
            } catch (error) {
                console.error("Error fetching favourites : ", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchFavourties();
    }, []);

    async function removeFavourite(productId) {
        try {
            const response = await fetch(`/api/favourites/${productId}`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unable to remove favourite.");
            setFavourites(prev => prev.filter(item => item.product_id !== productId));
        } catch (error) {
            console.error("Error removing favourite : ", error);
            setError(error.message);
        }
    }

    function goToProductPage(productId) {
        window.location.href = `/product/${productId}`;
    }

    if (loading) {
        return (
            <main className="favourites-page">
                <p className="favourites-status">Loading your favourites...</p>
            </main>
        )
    }    

    if (error) {
        return (
            <main className="favourites-page">
                <p className="favourites-status">{error}</p>
            </main>
        )
    }
    
    return (
        <main className="favourites-page">
            <div className="favourites-container">

                <div className="favourites-heading">
                    <span className="favourites-eyebrow">SAVED FOR LATER</span>
                    <h1>My Favourites</h1>
                    <p>The treats you've saved for another sweet moment.</p>
                </div>

                {favourites.length === 0 ? (
                    <div className="empty-favourites">
                        <div className="empty-favourites-icon">
                            <i className="fa-regular fa-heart"></i>
                        </div>
                        <h2>No favourites yet</h2>
                        <p>Save your favourite Crumbelle treats and they'll appear here.</p>
                        <a href="/shop" className="browse-shop-button">Explore Shop</a>
                    </div>
                ) : (
                    <div className="favourites-grid">
                        {favourites.map(item => (
                            <article className="favourite-card" key={item.favourite_id}>
                                <div className="favourite-image" onClick={() => goToProductPage(item.product_id)}>
                                    <img src={item.image} alt={item.name}height={290} />
                                </div>
                                <div className="favourite-info">
                                    <span className="favourite-category">{item.category_name}</span>
                                    <h2 onClick={() => goToProductPage(item.product_id)}>{item.name}</h2>
                                    <p>{item.description}</p>
                                    <div className="favourite-bottom">
                                        <span className="favourite-price">₹ {item.price}</span>
                                        <div className="favourite-actions">
                                            <button type="button" className="remove-favourite-button" onClick={() => removeFavourite(item.product_id)} aria-label={`Remove ${item.name} from favourites`} >
                                                <i className="fa-solid fa-heart"></i>
                                            </button>
                                            <button type="button" className="favourite-cart-button" onClick={() => goToProductPage(item.product_id)} disabled={!item.is_available}>
                                                {item.is_available ? "Add to Cart" : "Unavailable"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}