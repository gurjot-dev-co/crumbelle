import React from "react";
import { createRoot } from "react-dom/client";
import CartPage from "./components/CartPage";

const cartPage = document.getElementById("cart-page");

if (cartPage) createRoot(cartPage).render(<CartPage />);