export default function OrderSuccess( {orderId, paymentMethod, total} ) {
    const formattedTotal = total ? Number(total).toLocaleString("en-IN") : "0";
    const getPaymentText = () => {
        switch (paymentMethod) {
            case "card" :
                return "Card payment";
            case "upi" :
                return "UPI payment";
            case "cod" :
                return "Cash on delivery";
            default :
                return "Payment";
        }
    };
    const getMessage = () => {
        if (paymentMethod === "cod") return "Your order has been confirmed. Payment will be collected when your order is deliverd.";
        return "Your payment was successful and your order has been confirmed. We're getting your treats ready." 
    };

    return (
        <main className="order-success-page">
            <div className="order-success-container">

                <div className="order-success-icon">
                    <i className="fa-solid fa-check"></i>
                </div>

                <p className="order-success-eyebrow">ORDER CONFIRMED</p>
                <h1 className="order-success-title">Thank you for your order!</h1>
                <p className="order-success-message">{getMessage()}</p>

                <div className="order-success-details">
                    <div className="order-success-detail">
                        <span className="detail-label">Order Number</span>
                        <span className="detail-value"> {orderId ? `#${orderId}` : "-"} </span>
                    </div>
                    <div className="order-success-detail">
                        <span className="detail-label">Payment</span>
                        <span className="detail-value">{getPaymentText()}</span>
                    </div>
                    <div className="order-success-detail">
                        <span className="detail-label">Total</span>
                        <span className="detail-value">₹ {formattedTotal}</span>
                    </div>
                </div>

                <div className="order-success-actions">
                    <a href="/order-tracking" className="order-success-primary-button">Track Order</a>
                    <a href="/shop" className="order-success-secondary-button">Continue Shopping</a>
                </div>

                <p className="order-success-footer">Thank your for choosing Crumbelle.</p>
            </div>
        </main>
    );
}