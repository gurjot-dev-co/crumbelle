import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import BestSellerCard from "./components/BestSellerCard";

const bestSellerGrid = document.getElementById("best-sellers-grid");

function BestSellers() {
    const [products, setProducts] = useState([]);
    useEffect(() => {
        async function fetchBestSellers() {
            try {
                const response = await fetch("/api/products?bestSeller=true");
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                console.error("Error fetching best sellers:", error);
            }
        }
        fetchBestSellers();
    }, []);

    return (
        <div className="best-sellers-container">
            <div className="section-heading">
                <span>Crumbelle Favorites</span>
                <h2>Best Sellers</h2>
                <p>Our most-loved treats, baked fresh and made to delight.</p>
            </div>
            <div className="product-grid">
                {products.map((product) => {
                    return <BestSellerCard key={product.id} product={product} />
                })}
            </div>
        </div>
    )
}

if (bestSellerGrid) {
    const root = createRoot(bestSellerGrid);
    root.render(<BestSellers />)
}