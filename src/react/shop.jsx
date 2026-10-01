import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import ProductCard from "./components/ProductCard";

const productGrid = document.getElementById("product-grid");

if (productGrid) {

const category = productGrid.dataset.category;

function ProductGrid() {
    const [products, setProducts] = useState([]);
    useEffect(() => {
        async function fetchProducts() {
            try {
                const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        }
        fetchProducts();
    }, []);   // [] tell react to run this effect once when the component is first added to the page, and don't run it again when the component re-renders.
    return (
        <div className="products-container">
            <h2 className="products-title">{ category }</h2>
            <div className="product-grid">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product}/>
                ))}
            </div>
        </div>
    )
}

if (productGrid) {
    const root = createRoot(productGrid);
    root.render(<ProductGrid />);
}

}