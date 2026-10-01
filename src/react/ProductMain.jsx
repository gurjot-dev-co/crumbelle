import React from "react";
import { createRoot } from "react-dom/client";
import ProductPage from "./components/ProductPage";

const productPage = document.getElementById("product-page");

if (productPage) {
    const productId = productPage.dataset.productId;
    createRoot(productPage).render(<ProductPage productId={productId} />);
}