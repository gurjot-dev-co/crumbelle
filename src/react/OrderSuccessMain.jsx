import React from "react";
import { createRoot } from "react-dom/client";
import OrderSuccess from "./components/OrderSuccess";

const orderSuccessPage = document.getElementById("order-success-page");

if (orderSuccessPage) {
    const orderId = orderSuccessPage.dataset.orderId;
    const paymentMethod = orderSuccessPage.dataset.paymentMethod;
    const total = orderSuccessPage.dataset.total;

    createRoot(orderSuccessPage).render(<OrderSuccess orderId={orderId} paymentMethod={paymentMethod} total={total} />);
}