import { useEffect, useState } from "react";

export default function CartPage() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchCart() {
            try {
                const response = await fetch("/api/cart");
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 401) return window.location.href = "/login";
                    throw new Error(data.error || "Unable to load your cart.");
                }
                setCart(data.cart);
            } catch (error) {
                console.error("Error fetching cart : ", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCart();
    }, []);

    async function increaseQuantity(itemId) {
        const currentItem = cart.items.find((item) => item.id === itemId);
        if (!currentItem) return;
        const newQuantity = currentItem.quantity + 1;
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({
                    quantity: newQuantity
                })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update quantity");
            }
            setCart((currentCart) => {
                const updatedItems = currentCart.items.map((item) => {
                    if (item.id !== itemId) return item;
                    return {
                        ...item,
                        quantity: newQuantity,
                        itemTotal: item.price * newQuantity
                    };
                });
                return calculateCartTotals(
                    currentCart,
                    updatedItems
                );
            });
        } catch (error) {
            console.error("Error increasing quantity : ", error);
        }
    }

    async function decreaseQuantity(itemId) {
        const currentItem = cart.items.find((item) => item.id === itemId);
        if (!currentItem) return;

        // if quantity is greater than 1 than just decrease it
        if (currentItem.quantity > 1) {
            const newQuantity = currentItem.quantity - 1;
            try {
                const response = await fetch(`/api/cart/items/${itemId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify({
                        quantity: newQuantity
                    })
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to update quantity");
                }
                setCart((currentCart) => {
                    const updatedItems = currentCart.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return {
                            ...item,
                            quantity: newQuantity,
                            itemTotal: item.price * newQuantity
                        };
                    });
                    return calculateCartTotals(
                        currentCart,
                        updatedItems
                    );
                });
            } catch (error) {
                console.error("Error decreasing quantity : ", error);
            }
            return;
        }

        // if quantity is 1, remove the item
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to remove item");
            }
            // handle temporary empty space
            setCart((currentCart) => {
                const updatedItems = currentCart.items.map((item) => {
                    if (item.id !== itemId) return item;
                    return {
                        ...item,
                        quantity: 0,
                        itemTotal: 0,
                        removed: true
                    };
                });
                return calculateCartTotals(
                    currentCart,
                    updatedItems
                );
            });
        } catch (error) {
            console.error("Error removing cart item : ", error);
        }
    }

    async function removeItem(itemId) {
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to remove item");
            }
            setCart((currentCart) => {
                const updatedItems = currentCart.items.map((item) => {
                    if (item.id !== itemId) return item;
                    return {
                        ...item,
                        quantity: 0,
                        itemTotal: 0,
                        removed: true
                    };
                });
                return calculateCartTotals(
                    currentCart,
                    updatedItems
                );
            });
        } catch (error) {
            console.error("Error removing cart item : ", error);
        }
    }

    function calculateCartTotals(currentCart, items) {
        const activeItems = items.filter((item) => !item.removed);
        const subtotal = activeItems.reduce((total, item) => total + item.itemTotal, 0);
        const gst = Math.round(subtotal * 0.05);
        const delivery = activeItems.length > 0 ? currentCart.delivery : 0;
        const total = subtotal + gst + delivery;
        return {
            ...currentCart,
            items,
            subtotal,
            gst,
            delivery,
            total
        };
    }

    function goToProductPage(productId) {
        window.location.href = `/product/${productId}`;
    }

    if (loading) {
        return (
            <main className="cart-page">
                <div className="cart-container">
                    <p className="cart-loading">Loading your cart...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="cart-page">
                <div className="cart-container">
                    <p className="cart-error">{error}</p>
                </div>
            </main>
        );
    }

    if (!cart) return null;

    if (cart.items.length === 0) {
        return ( 
            <main className="cart-page">
                <div className="cart-container">
                    <h1 className="cart-title">Your Cart</h1>
                    <div className="empty-cart">
                        <h2>Your cart is empty.</h2>
                        <p>Add some of your favourite Crumbelle treats to get started.</p>
                        <a href="/shop" className="continue-shopping-button">Continue Shopping</a>  
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="cart-page">
            <div className="cart-container">
                <h1 className="cart-title">Your Cart</h1>
                <div className="cart-header">
                    <span className="cart-product-heading">Product</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                </div>
                <div className="cart-items">
                    {cart.items.map((item) => (
                        <div className="cart-item" key={item.id}>
                            {!item.removed && ( 
                                <>
                                    <div className="cart-product">
                                        <img src={item.image} alt={item.name} className="cart-product-image" width={100} onClick={() => goToProductPage(item.productId) }/>
                                        <div className="cart-product-info">
                                            <a href={`/product/${item.productId}`} className="cart-product-name">{item.name}</a>
                                            <button type="button" className="remove-item-button" onClick={() => removeItem(item.id)}>Remove</button>
                                        </div>
                                    </div>
                                    <div className="cart-quantity">
                                        <button type="button" onClick={() => decreaseQuantity(item.id)} className="quantity-button" aria-label={`Decrease quantity of ${item.name}`} >-</button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button type="button" onClick={() => increaseQuantity(item.id)} className="quantity-button" aria-label={`Increase quantity of ${item.name}`} >+</button>
                                    </div>
                                    <div className="cart-item-price">₹{item.price.toLocaleString("en-IN")}</div>
                                    <div className="cart-item-total">₹{item.itemTotal.toLocaleString("en-IN")}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row">
                        <span>GST</span>
                        <span> ₹{cart.gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="summary-row">
                        <span>Delivery</span>
                        <span>₹{cart.delivery.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row summary-total">
                        <span>Total</span>
                        <span>₹{cart.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="cart-actions">
                        <a href="/checkout" className="checkout-button">Proceed to Checkout</a>
                    </div>
                </div>
            </div>
        </main>
    );
}