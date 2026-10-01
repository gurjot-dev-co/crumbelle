import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import ProductCard from "./components/ProductCard";

const shopPage = document.getElementById("shop-all-categories");

if (shopPage) {
    function Shop() {
        const [products, setProducts] = useState([]);
        useEffect(() => {
            async function fetchProducts() {
                try {
                    const response = await fetch("/api/products");
                    const data = await response.json();
                    setProducts(data);
                } catch (error) {
                    console.error("Error fetching products:", error);
                }
            }
            fetchProducts();
        }, []);

        return (
            <div className="shop-container">
                <div className="shop-header">
                    <h1>Shop</h1>
                    <p>Explore all of our freshly baked treats.</p>
                </div>
                <div className="product-grid">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        );
    }

    const root = createRoot(shopPage).render(<Shop />);
}