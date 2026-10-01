import { useEffect, useState } from "react";

export default function CheckoutPage() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: ""
    });

    const [paymentMethod, setPaymentMethod] = useState("");

    const [cardData, setCardData] = useState({
        cardNumber: "",
        expiry: "",
        cvv: "",
        cardName: ""
    });

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

    function handleInputChange(event) {
        const {name, value} = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function handleCardChange(event) {
        const {name, value} = event.target;
        setCardData(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function handlePaymentChange(method) {
        setPaymentMethod(method);
    }

    async function handlePlaceOrder(event) {
        event.preventDefault();
        if (!paymentMethod) return alert("Please select a payment method.");
        try {
            const response = await fetch("/api/place-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    paymentMethod,
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode
                })
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401) return window.location.href = "/login";
                throw new Error(data.error || "Unable to place your order.");
            } 
            window.location.href =
                `/order-success?orderId=${encodeURIComponent(data.orderNumber)}` +
                `&paymentMethod=${encodeURIComponent(data.paymentMethod)}` +
                `&total=${encodeURIComponent(data.total)}`;
        } catch (error) {
            console.error("Error placing order:", error);
            setError(error.message);
        }
    }
    
    if (loading) {
        return (
            <main className="checkout-page">
                <p className="checkout-status">Loading checkout...</p>
            </main>
        )
    }

    if (error) {
        return (
            <main className="checkout-page">
                <p className="checkout-status">{error}</p>
            </main>
        )
    }

    if (!cart) return null;

    const activeItems = cart.items.filter(item => !item.removed);

    return (
        <main className="checkout-page">
            <div className="checkout-container">

                <div className="checkout-heading">
                    <span className="checkout-eyebrow">SECURE CHECKOUT</span>
                    <h1>Checkout</h1>
                    <p>Complete your details below to place your order.</p>
                </div>

                <div className="checkout-layout">

                    <form id="checkout-form" className="checkout-form" onSubmit={handlePlaceOrder}>

                        {/* delivery details */}
                        <section className="checkout-section">

                            <div className="checkout-section-heading">
                                {/* <span className="section-number">01</span> */}
                                <div>
                                    <h2>Delivery Details</h2>
                                    <p>Where should we deliver your order?</p>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group form-group-full">
                                    <label htmlFor="name">Full Name</label>
                                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" required />
                                </div>
                                <div className="form-group form-group-full">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone number" required />
                                </div>
                                <div className="form-group form-group-full">
                                    <label htmlFor="address">Delivery Address</label>
                                    <textarea name="address" id="address" value={formData.address} onChange={handleInputChange} placeholder="House number, Street number, area" rows={3} maxLength={500} required></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="state">State</label>
                                    <input type="text" id="state" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" required />
                                </div>
                                <div className="form-group form-group-full">
                                    <label htmlFor="pincode">Pincode</label>
                                    <input type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="6-digit pincode" required />
                                </div>
                            </div>

                        </section>

                        <section className="checkout-section">

                            <div className="section-heading">
                                {/* <span className="section-number">02</span> */}
                                <div>
                                    <h2>Payment Method</h2>
                                    <p>Choose how you'd like to pay.</p>
                                </div>
                            </div>

                            <div className="payment-options">

                                {/* card */}
                                <div className={`payment-option ${[paymentMethod === "card" ? "selected" : ""]}`}>
                                    <label className="payment-option-header">
                                        <input type="radio" name="payment" value="card" checked={paymentMethod === "card"} onChange={() => handlePaymentChange("card")} />
                                        <span className="payment-radio"></span>
                                        <span className="payment-title">Credit / Debit Card</span>
                                    </label>
                                    {paymentMethod === "card" && (
                                        <div className="payment-details">

                                            <div className="card-brands">
                                                <a href="#" className="visa-card">
                                                    <img src="/assets/images/payment-cards/visa card.jpg" alt="visa payment card" height={42} />
                                                </a>
                                                <a href="#" className="masterpay-card">
                                                    <img src="/assets/images/payment-cards/masterpay card.jpg" alt="masterpay payment card" height={42} />
                                                </a>
                                                <a href="#" className="rupay-card">
                                                    <img src="/assets/images/payment-cards/rupay card.jpg" alt="rupay payment card" height={42} />
                                                </a>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="cardNumber">Card Number</label>
                                                <input type="text" id="cardNumber" name="cardNumber" value={cardData.cardNumber} onChange={handleCardChange} placeholder="1234 5678 9012 3456" maxLength="19" />
                                            </div>

                                            <div className="card-small-fields">
                                                <div className="form-group">
                                                    <label htmlFor="expiry">Expiry Date</label>
                                                    <input type="text" name="expiry" id="expiry" value={cardData.expiry} onChange={handleCardChange} placeholder="MM / YY" maxLength="5" />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="cvv">CVV</label>
                                                    <input type="password" name="cvv" id="cvv" value={cardData.cvv} onChange={handleCardChange} placeholder="***" maxLength="4" />
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label htmlFor="cardName">Name on Card</label>
                                                <input type="text" name="cardName" id="cardName" value={cardData.cardName} onChange={handleCardChange} placeholder="Name printed on card" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* UPI */}
                                <div className={`payment-option ${paymentMethod === "upi" ? "selected" : "" }`}>
                                    <label className="payment-option-header">
                                        <input type="radio" name="payment" value="upi" checked={paymentMethod === "upi"} onChange={() => handlePaymentChange("upi")} />
                                        <span className="payment-radio"></span>
                                        <span className="payment-title">Scan & Pay with UPI</span>
                                    </label>
                                    {paymentMethod === "upi" && (
                                        <div className="payment-details upi-details">
                                            <div className="upi-qr-placeholder">
                                                <i className="fa-solid fa-qrcode"></i>
                                                <span>QR Code</span>
                                            </div>
                                            <p>Scan the QR code using any UPI app to complete your payment.</p>
                                        </div>
                                    )}
                                </div>

                                {/* COD */}
                                <div className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}>
                                    <label className="payment-option-header">
                                        <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => handlePaymentChange("cod")} />
                                        <span className="payment-radio"></span>
                                        <span className="payment-title">Cash on Delivery</span>
                                    </label>
                                    {paymentMethod === "cod" && (
                                        <div className="payment-details cod-details">
                                            <p>Pay when your order arrives.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </form>

                    <aside className="order-summary">
                        <div className="summary-header">
                            <span className="summary-eyebrow">Your Order</span>
                            <h2>Order Summary</h2>
                        </div>
                        {/* items */}
                        <div className="summary-items">
                            {activeItems.map(item => (
                                <div className="summary-item" key={item.id}>
                                    <div className="summary-item-image">
                                        <img src={item.image} alt={item.name} height={150} />
                                    </div>
                                    <div className="summary-item-details">
                                        <h3>{item.name}</h3>
                                        <span>x {item.quantity}</span>
                                    </div>
                                    <strong>₹ {item.itemTotal}</strong>
                                </div>
                            ))}
                        </div>  
                        {/* totals */}
                        <div className="checkout-summary-divider"></div>
                        <div className="checkout-summary-row">
                            <span>Subtotal</span>
                            <span>₹ {cart.subtotal}</span>
                        </div>
                        <div className="checkout-summary-row">
                            <span>GST</span>
                            <span>₹ {cart.gst}</span>
                        </div>
                        <div className="checkout-summary-row">
                            <span>Delivery</span>
                            <span>₹ {cart.delivery}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="checkout-summary-total">
                            <span>Total</span>
                            <span>₹ {cart.total}</span>
                        </div>
                        {/* place order */}
                        <button type="submit" form="checkout-form" className="place-order-button">Place Order</button>
                        <p className="secure-message">
                            <i className="fa-solid fa-lock"></i>
                            Your information is securely handled.
                        </p>
                    </aside>
                </div>
            </div>
        </main>
    );
};