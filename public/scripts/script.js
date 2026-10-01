const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");

menuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
    menuButton.classList.toggle("active");
});

document.addEventListener("click", (event) => {
    if(!mobileMenu.contains(event.target) && !menuButton.contains(event.target)) {
        mobileMenu.classList.remove("active");
        menuButton.classList.remove("active");
    }
});


// search bar 

// The main search container in the header
const headerSearch = document.querySelector(".header-search");

// The actual search input where the user types
const headerSearchInput = document.querySelector("#header-search-input");

// The area where matching product suggestions will appear
const searchSuggestions = document.querySelector(".search-suggestions");

// This array will store all products received from the server.
// We load the products once and then search through them instead of making a new API request for every letter typed.
let allSearchProducts = [];

// LOAD PRODUCTS FOR SEARCH

async function loadSearchProducts() {
    try {
        // Get all products from your Express API
        const response = await fetch("/api/products");

        // Stop if the server returned an error
        if (!response.ok) throw new Error("Unable to load products for search.");

        // Convert the server response into JavaScript data
        const data = await response.json();

        // Your API might return:
        // 1. an array directly -> [product1, product2, ...]
        // OR
        // 2. an object -> { products: [...] }
        // This handles both formats.
        allSearchProducts = Array.isArray(data) ? data : data.products || [];

    } catch (error) {
        // Show the error in the browser console if the product API cannot be loaded.
        console.error("Search products error:", error);
        // Keep the array empty so the rest of the code does not crash.
        allSearchProducts = [];
    }
}

// ONLY RUN SEARCH CODE IF THE HTML ELEMENTS EXIST
// This prevents JavaScript errors on pages where the search HTML might not be present.

if (headerSearch && headerSearchInput && searchSuggestions) {

    // LOAD PRODUCTS WHEN USER HOVERS OVER THE SEARCH

    headerSearch.addEventListener("mouseenter", async () => {
        // Only load products if we have not loaded them yet.
        // This prevents /api/products from being requested every time the user moves the mouse over the search.
        if (!allSearchProducts.length) {
            await loadSearchProducts();
        }
    });

    // LIVE SEARCH - RUNS EVERY TIME USER TYPES

    headerSearchInput.addEventListener("input", () => {
        // Get what the user typed
        // trim() removes unnecessary spaces at the beginning and end.
        // toLowerCase() makes searching case-insensitive.
        // For example: "PIS", "Pis", and "pis" all become "pis".
        const searchTerm = headerSearchInput.value.trim().toLowerCase();

        // IF SEARCH BOX IS EMPTY

        if (!searchTerm) {
            // Remove any old suggestions
            searchSuggestions.innerHTML = "";

            // Hide the suggestion box
            searchSuggestions.classList.remove("show");
            return;
        }

        // FIND MATCHING PRODUCTS

        const matchingProducts = allSearchProducts
            // First filter the products
            .filter(product => {
                // Product name, for example: "Pistachio Cookies"
                const productName = String(product.name || "").toLowerCase();

                // Product category, for example: "Cookies"
                const category = String(product.category || "").toLowerCase();

                // Keep the product when the search text appears either in the product name OR in the category.
                // Example:
                // Search "pis"
                // -> Pistachio Cookies 
                // -> Pistachio Cupcake 

                // Search "cookie"
                // -> Pistachio Cookies
                // because "cookie" appears in its category/name.
                return (
                    productName.includes(searchTerm) ||
                    category.includes(searchTerm)
                );
            })

            // SORT MATCHES
            // Products whose NAME STARTS with the typed text r placed before products where the text appears somewhere in the middle.
            // Example for "pis":
            // Pistachio Cookies      <- first
            // Pistachio Cupcake      <- first
            // Pistachio Cheesecake   <- first

            // This feels more like a normal website search.

            .sort((a, b) => {
                const aName = String(a.name || "").toLowerCase();
                const bName = String(b.name || "").toLowerCase();

                // Does product A start with the search term?
                const aStarts = aName.startsWith(searchTerm);

                // Does product B start with the search term?
                const bStarts = bName.startsWith(searchTerm);

                // Product A starts with the term, product B does not -> A comes first.
                if (aStarts && !bStarts) return -1;

                // Product B starts with the term, product A does not -> B comes first.
                if (!aStarts && bStarts) return 1;

                // If both have the same priority, sort alphabetically by product name.
                return aName.localeCompare(bName);
            })

            // Only show the first 6 products. This keeps the dropdown compact.
            .slice(0, 6);

        // NO MATCHING PRODUCTS

        if (!matchingProducts.length) {
            // Show a msg instead of an empty dropdown.
            searchSuggestions.innerHTML = `
                <div class="search-no-results">
                    No products found for "${escapeSearchText(searchTerm)}"
                </div>
            `;
            // Make the suggestion box visible
            searchSuggestions.classList.add("show");
            return;
        }

        // CREATE THE SUGGESTION ITEMS

        searchSuggestions.innerHTML = matchingProducts
            // Create HTML for every matching product
            .map(product => {
                // Product ID is needed so that clicking the suggestion can open the correct ProductPage.
                const productId = product.id;

                // Use the product's image.
                // If the product has no image, use a default image instead.
                const image = product.image || "/assets/images/products/default-product.jpg";

                // Get the product price.
                // ?? "" means if price is null/undefined, use an empty string instead.
                const price = product.price ?? "";

                // Return the HTML for this suggestion.
                return `
                    <button type="button" class="search-suggestion" data-product-id="${productId}">

                        <!-- Product image -->
                        <div class="search-suggestion-image">
                            <img src="${escapeSearchAttribute(image)}" alt="${escapeSearchAttribute(product.name)}">
                        </div>

                        <!-- Product name and price -->
                        <div class="search-suggestion-details">
                            <span class="search-suggestion-name">
                                ${escapeSearchText(product.name)}
                            </span>
                            ${
                                price !== ""
                                    ? `
                                        <span class="search-suggestion-price">
                                            ₹ ${escapeSearchText(price)}
                                        </span>
                                    `
                                    : ""
                            }
                        </div>

                    </button>
                `;
            })
            // Combine all suggestion HTML into one string
            .join("");
        // Make the suggestion dropdown visible
        searchSuggestions.classList.add("show");
    });

    // CLICKING A SEARCH SUGGESTION
    searchSuggestions.addEventListener("click", event => {
        // Find the suggestion button that was clicked.
        // closest() is useful because the user might actually click the image or product name inside the button.
        const suggestion = event.target.closest(".search-suggestion");

        // If the click was not on a suggestion, do nothing.
        if (!suggestion) return;

        // Get the product ID stored in: data-product-id="123"
        const productId = suggestion.dataset.productId;

        // If there is no ID, stop.
        if (!productId) return;

        // Open that product's ProductPage.
        // Example: /product/63
        window.location.href = `/product/${encodeURIComponent(productId)}`;
    });

    // PRESSING ENTER IN THE SEARCH BOX
    headerSearchInput.addEventListener("keydown", event => {
        // We only care about the Enter key.
        if (event.key !== "Enter") return;

        // Prevent the browser from submitting the form and refreshing the page.
        event.preventDefault();

        // Find the first product currently shown in the suggestions.
        const firstSuggestion = searchSuggestions.querySelector(".search-suggestion");

        // IF THERE IS A SUGGESTION
        if (firstSuggestion) {
            // Get its product ID
            const productId = firstSuggestion.dataset.productId;
            // Open the first matching product
            if (productId) {
                window.location.href = `/product/${encodeURIComponent(productId)}`;
            }
            return;
        }

        // IF THERE IS NO SUGGESTION, Get whatever the user typed
        const searchTerm = headerSearchInput.value.trim();

        // Do nothing if the search box is empty
        if (!searchTerm) return;

        // Otherwise send the user to the Shop page with the search text in the URL.
        // Example: /shop?search=chocolate
        window.location.href =
            `/shop?search=${encodeURIComponent(searchTerm)}`;
    });

    // CLOSE SUGGESTIONS WHEN CLICKING OUTSIDE
    document.addEventListener("click", event => {
        // If the click happened outside the search area, hide the suggestions.
        if (!headerSearch.contains(event.target)) {
            searchSuggestions.classList.remove("show");
        }
    });
}

// SECURITY / HTML ESCAPING
// These funcs make sure product names, img paths, search text, etc. can't accidentally break the HTML.
// They r esp. useful bc we r inserting product info using innerHTML.
function escapeSearchText(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// This uses the same escaping because image URLs and alt text are being placed inside HTML attributes.
function escapeSearchAttribute(value) {
    return escapeSearchText(value);
}



const passwordLogin = document.getElementById("password-login");
const otpLogin  = document.getElementById("otp-login");
const otpLoginForm = document.getElementById("otp-login-form");

const passwordInput = document.getElementById("password");
const otpInput = document.getElementById("otp");

const showOtpLogin = document.getElementById("show-otp-login");
const showPasswordLogin = document.getElementById("show-password-login");

const passwordDivider = document.querySelector(".login-divider");

const passwordIdentifier = document.getElementById("password-identifier");
const otpIdentifier = document.getElementById("otp-identifier");

const identifierInput = document.getElementById("identifier");
const otpEmailInput = document.getElementById("otpEmail");

if (showOtpLogin && showPasswordLogin) {

    showOtpLogin.addEventListener("click", () => {
        passwordLogin.style.display = "none";
        otpLogin.style.display = "none";
        otpLoginForm.style.display = "block";
        showPasswordLogin.style.display = "block";
    
        passwordDivider.style.display = "none";
    
        passwordIdentifier.style.display = "none";
        otpIdentifier.style.display = "block";

        // password login identifier
        identifierInput.required = false;
        identifierInput.disabled = true;
    
        otpEmailInput.required = true;
        otpEmailInput.disabled = false;
    
        passwordInput.required = false;
        passwordInput.disabled = true;
    
        otpInput.required = true;
        otpInput.disabled = false;
    });
    
    showPasswordLogin.addEventListener("click", () => {
        passwordLogin.style.display = "block";
        otpLogin.style.display = "block";
        otpLoginForm.style.display = "none";
        showPasswordLogin.style.display = "none";
    
        passwordDivider.style.display = "flex";
    
        passwordIdentifier.style.display = "block";
        otpIdentifier.style.display = "none";
    
        // enable password login identifier
        identifierInput.required = true;
        identifierInput.disabled = false;
    
        otpEmailInput.required = false;
        otpEmailInput.disabled = true;
    
        passwordInput.required = true;
        passwordInput.disabled = false;
    
        otpInput.required = false;
        otpInput.disabled = true;
    });
}


const sendLoginOtp = document.getElementById("send-login-otp");
const resendLoginOtp = document.getElementById("resend-login-otp");

async function sendLoginOtpRequest(button) {
    const identifier = otpEmailInput.value.trim();
    if (!identifier) return window.location.href = "/login?error=contactRequired";
    const originalText = button.textContent;
    const message = document.getElementById("otp-message");
    try {
        button.disabled = true;
        button.textContent = "Sending...";
        button.classList.add("sending");

        const response = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifier: identifier,
                purpose: "login"
            })
        });
        const data = await response.json();
        if (!response.ok) { 
            message.textContent = data.error;
            message.style.display = "block";
            message.classList.remove("auth-success");
            message.classList.add("auth-error");
            
            console.error("Error sending OTP : ", data.error);
            button.textContent = originalText;
            button.classList.remove("sending");
            button.disabled = false;
            return;
        };
        console.log(data.message);

        message.textContent = data.message;
        message.style.display = "block";
        message.classList.remove("auth-error");
        message.classList.add("auth-success");

        button.textContent = "OTP Sent ✓";
        button.classList.remove("sending");
        button.classList.add("sent");
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove("sent");
            button.disabled = false;
        }, 1800);
    } catch (error) {
        console.error("Error sending OTP : ", error);

        message.textContent =  "OTP could not be sent. Please try again";
        message.style.display = "block";
        message.classList.remove("auth-success");
        message.classList.add("auth-error");

        button.textContent = originalText;
        button.classList.remove("sending");
        button.disabled = false;
    }
}

if (sendLoginOtp) sendLoginOtp.addEventListener("click", () => {
    sendLoginOtpRequest(sendLoginOtp);
});
if (resendLoginOtp) resendLoginOtp.addEventListener("click", () => {
    sendLoginOtpRequest(resendLoginOtp);
});


async function updateFavouriteCount() {
    try {
        const response = await fetch("/api/favourites/count");
        const data = await response.json();
        const favouriteCount = document.querySelector(".favourite-count");
        if (!favouriteCount) return;
        if (!response.ok) return favouriteCount.textContent = "0";
        favouriteCount.textContent = data.count;
    } catch (error) {
        console.error("Error fetching favourite count:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateFavouriteCount();
});

async function updateCartCount() {
    const cartCountElement = document.querySelector(".cart-count"); 
    try {
        const response = await fetch(`/api/cart`);
        if (response.status === 401) return cartCountElement.textContent = 0;
        const data = await response.json();
        if (!response.ok) return console.error("Erro fetching cart : ", data.error);
        const cartCount = data.cart.items.reduce((total, item) => total + item.quantity, 0);
        if (cartCountElement) cartCountElement.textContent = cartCount;
    } catch (error) {
        console.error("Error uploading cart count : ", error);
    }
}
updateCartCount();