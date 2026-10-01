import React from "react";
import { createRoot } from "react-dom/client";
import CheckoutPage from "./components/CheckoutPage";

const checkoutPage = document.getElementById("checkout-page");

if (checkoutPage) createRoot(checkoutPage).render(<CheckoutPage /> );