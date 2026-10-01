import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const app = express();
const port = process.env.PORT || 3000;

function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

// creates a Vite dev server that works in the Express app, allowing Express to remain on port 3000 while Vite processes ur React/JSX
async function startServer() {
    const vite = await createViteServer({
        server: {
            middlewareMode: true  // tells vite to run as a middleware in Express, rather than creating its own separate server/port
        },
        appType: "custom"  // tells vite that Express is handling the main ejs pages, not vite
    });
    app.use(vite.middlewares);
    
    // const { Pool } = pg;   // destructuring    
    const pool = new pg.Pool ({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    });
    
    async function verifyOtp(identifier, otp, purpose) {
        if (!otp || !otp.trim()) {
            return {
                success: false,
                error: "otpRequired"
            };
        }
        const result = await pool.query(`SELECT id, otp_hash, expires_at FROM otp_codes WHERE identifier = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1`,
            [identifier.trim(), purpose]
        );
        if (result.rows.length === 0) {
            return {
                success: false,
                error: "invalidOtp"
            };
        }
        const otpRecord = result.rows[0];
        if (new Date(otpRecord.expires_at) <= new Date()) {
            await pool.query(`DELETE FROM otp_codes WHERE id = $1`, [otpRecord.id]);
            return {
                success: false,
                error: "expiredOtp"
            };
        }
        const otpMatch = await bcrypt.compare(otp.trim(), otpRecord.otp_hash);
        if (!otpMatch) {
            return {
                success: false,
                error: "invalidOtp"
            };
        }
        // otp successfully used so remove it 
        await pool.query(`DELETE FROM otp_codes WHERE id = $1`, [otpRecord.id]);
        return {
            success: true
        };    
    }

    app.use(bodyParser.urlencoded({extended : true}));
    app.use(express.json());

    app.use(session({
        secret: process.env.SESSION_SECRET,    // secret to sign the session cookie
        resave: false,                  // don't save session to session store if nthi' changed
        saveUninitialized: false,       // don't create session for who has't started actually using one.
        cookie: {
            maxAge: 1000 * 60 * 60 * 24         // browser session cookie for 24 hours 
        }
    }));

    app.use((req, res, next) => {
        res.locals.userId = req.session.userId || null;
        res.locals.userName = req.session.userName || null;
        next();
    });

    app.use(express.static("public"));
    
    app.get("/", (req, res) => {
        res.render("index.ejs");
    });
    
    app.get("/product/:id" , async (req, res) => {
        res.render("product.ejs", {
            productId: req.params.id
        });
    });
    
    app.get("/cart", (req, res) => {
        res.render("cart.ejs");
    });

    app.get("/signup", (req, res) => {
        const { error} = req.query;
        res.render("sign-up.ejs", {
            error
        });
    });

    app.get("/login", (req, res) => {
        const {error, otp} = req.query;
        res.render("log-in.ejs", {
            error,
            otp
        });
    });

    app.get("/favourites", (req, res) => {
        res.render("favourites.ejs");
    });

    app.get("/shop", (req, res) => {
        res.render("shop-all-categories.ejs");
    });

    app.get("/about", (req, res) => {
        res.render("about.ejs");
    });

    app.get("/our-story", (req, res) => {
        res.render("our-story.ejs");
    });

    app.get("/contact", (req, res) => {
        res.render("contact.ejs");
    });

    app.get("/faqs", (req, res) => {
        res.render("faqs.ejs");
    });

    app.get("/shipping-delivery", (req, res) => {
        res.render("shipping-delivery.ejs");
    });
    
    app.get("/returns-refunds", (req, res) => {
        res.render("returns-refunds.ejs");
    });
    
    app.get("/order-tracking", (req, res) => {
        res.render("order-tracking.ejs");
    });
    
    app.get("/privacy-policy", (req, res) => {
        res.render("privacy-policy.ejs");
    });
    
    app.get("/terms-conditions", (req, res) => {
        res.render("terms-conditions.ejs");
    });
    app.get("/checkout", (req, res) => {
        res.render("checkout.ejs");
    });

    app.get("/order-success", (req, res) => {
        res.render("order-success-page.ejs", {
            orderId: req.query.orderId || null,
            paymentMethod: req.query.paymentMethod || null,
            total: req.query.total || null
        });
    });

    app.get("/logout", (req, res) => {
        req.session.destroy(error => {
            if (error) {
                console.error("Error logging out : ", error);
                return res.redirect("/");
            }
            res.redirect("/");
        });
    }); 

    
    app.post("/signup", async (req, res) => {
        try {
            const {name, identifier, password} = req.body;
            // name
            if (!name || !name.trim()) return res.redirect("/signup?error=nameRequired");
            // email
            if (!identifier || !identifier.trim()) return res.redirect("/signup?error=contactRequired");
            // password
            if (!password) return res.redirect("/signup?error=passwordRequired");
            
            const trimmedIdentifier = identifier.trim();

            let email = null;
            let phone = null;

            if (trimmedIdentifier.includes("@")) {
                email = trimmedIdentifier.toLowerCase();
            } else {
                phone = trimmedIdentifier;
            }

            const existingUser = await pool.query(`SELECT id FROM users WHERE email = $1 OR phone = $2`, [email, phone]);
            if (existingUser.rows.length > 0) {
                if (email) return res.redirect("/signup?error=emailExists");
                return res.redirect("/signup?error=phoneExists");
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const result = await pool.query(`INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`, [name.trim(), email, phone, passwordHash]);
            // log in the user
            req.session.userId = result.rows[0].id;
            req.session.userName = name.trim();
            res.redirect("/");
        } catch (error) {
            console.error("Error creating account: ", error);
            res.redirect("/signup?error=server");
        }
    });


    app.get("/api/cart", async (req, res) => {
        try {
            if (!req.session.userId) {
                return res.status(401).json({
                    error: "Please log in to view your cart."
                })
            }
            const cartResult = await pool.query(`SELECT id FROM cart WHERE user_id = $1`, [req.session.userId]);
            if (cartResult.rows.length === 0) {
                return res.json({
                    cart: {
                        id: null,
                        items: [],
                        subtotal: 0,
                        gst: 0,
                        delivery: 0,
                        total: 0
                    }
                });
            }
            const cartId = cartResult.rows[0].id;
            const itemsResult = await pool.query(`SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image 
                FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1 ORDER BY ci.id`, [cartId]);
            const items = itemsResult.rows.map((item) => ({
                id: item.id,
                productId: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                itemTotal: Number(item.price) * item.quantity
            }));
            const subtotal = items.reduce((total, item) => total + item.itemTotal, 0);
            const gst = Math.round(subtotal * 0.05);
            const delivery = items.length > 0 ? 50 : 0;
            const total = subtotal + gst + delivery;
            return res.json({
                cart: {
                    id: cartId,
                    items,
                    subtotal,
                    gst,
                    delivery,
                    total
                }
            });
        } catch (error) {
            console.error("Error fetching cart : ", error);
            return res.status(500).json({
                error: "Unable to load cart."
            });
        }
    });

    // update an item's quantity
    app.patch("/api/cart/items/:id", async(req, res) => {
        try {
            if (!req.session.userId) return res.status(401).json({ error : "You must be logged in"});
            const cartItemId = req.params.id;
            const {quantity} = req.body;
            if (!Number.isInteger(quantity) || quantity < 1) return req.status(400).json({ error : "Quantity must be a positive integer."});

            // make sure this cart item belongs to a logged in user's cart, they shouldn't be able to modify another user's cart
            const result = await pool.query(`UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = (SELECT id FROM cart WHERE user_id = $3) RETURNING *`, [quantity, cartItemId, req.session.userId]);
            if (result.rows.length === 0) return res.json(404).json({ error : "Cart item not found."});
            await pool.query("UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [req.session.userId]);
            
            res.json({
                message: "Cart item updated.",
                item: result.rows[0]
            });
        } catch (error) { 
            console.error("Error updating cart item: ", error);
            res.status(500).json({ error : "Internal server error"});
        }
    })

    // remove one item
    app.delete("/api/cart/items/:id", async (req, res) => {
        try {
            if (!req.session.userId) return res.status(401).json({ error : "You must be logged in."});
            const cartItemId = req.params.id;
            const result = await pool.query(`DELETE FROM cart_items WHERE id = $1 AND cart_id = (SELECT id FROM cart WHERE user_id = $2) RETURNING *`, [cartItemId, req.session.userId]);
            if (result.rows.length === 0) return res.status(404).json({ error : "Cart item not found."})
            await pool.query(`UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`, [req.session.userId]);
            res.json({
                message: "Cart item removed",
                item: result.rows[0]
            });
        } catch (error) {
            console.error("Error removing cart item : ", error);
            res.status(500).json({ error : "Internal server error" });
        }
    });

    app.post("/api/auth/send-otp", async (req, res) => {
        try {
            const {identifier, purpose} = req.body;
            if (!identifier || !identifier.trim()) {
                return res.status(400).json({
                    error: "Email address is required."
                });
            }

            // make sure the otp purpose is valid
            // if (!["signup", "login"].includes(purpose)) {
            if (purpose !== "login") {
                return res.status(400).json({
                    error: "Invalid OTP purpose."
                });
            }

            const trimmedIdentifier = identifier.trim();
            if (!trimmedIdentifier.includes("@")) {
                return res.status(400).json({
                    error: "Please enter a valid email address."
                });
            }

            // for login make sure the account already exists
            if (purpose === "login") {
                const userResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [trimmedIdentifier]);
                if (userResult.rows.length === 0) {
                    return res.status(401).json({
                        error: "Invalid email address"
                    })
                }
            }

            // email otp
            const otp = generateOtp();
            const otpHash = await bcrypt.hash(otp, 10);
            const expiresAt = new Date ( Date.now() + 5 * 60 * 1000 );
            await emailTransporter.sendMail({
                from: process.env.SMTP_FROM,
                to: trimmedIdentifier,
                subject: "Your Crumbelle OTP",
                text: `Your Crumbelle verification code is ${otp}. It expires in 5 minutes.`
            });
            await pool.query(`DELETE FROM otp_codes WHERE identifier = $1 AND purpose = $2`, [trimmedIdentifier, purpose]);
            await pool.query(`INSERT INTO otp_codes (identifier, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)`,
                [trimmedIdentifier, otpHash, purpose, expiresAt]);

            res.json({
                success: true,
                message: "OTP sent successfully."
            });
        } catch (error) {
            console.error("Error sending OTP : ", error);
            res.status(500).json({
                error: "OTP could not be sent. Please try again."
            })
        }
    });

    app.post("/login", async (req, res) => {
        try {
            const {identifier, password, otpEmail, otp, loginmethod} = req.body;
            // password login
            if (loginmethod === "password") {
                if (!identifier || !identifier.trim()) return res.redirect("/login?error=contactRequired");
                if (!password) return res.redirect("/login?error=invalid");

                const trimmedIdentifier = identifier.trim();
                const result = await pool.query(`SELECT id, name, email, phone, password_hash FROM users WHERE email = $1 OR phone = $1`, [trimmedIdentifier]);
                if (result.rows.length === 0) return res.redirect("/login?error=invalid");
                const user = result.rows[0];
                const passwordMatch = await bcrypt.compare(password, user.password_hash);
                if (!passwordMatch) return res.redirect("/login?error=invalid");
                req.session.userId = user.id;
                req.session.userName = user.name;
                return res.redirect("/");
            }
            // otp login
            if (loginmethod === "otp") {
                if (!otpEmail || !otpEmail.trim()) return res.redirect("/login?error=contactRequired");
                const trimmedEmail = otpEmail.trim().toLowerCase();

                if (!otp || !otp.trim()) return res.redirect("/login?error=otpRequired");

                const verification = await verifyOtp(trimmedEmail, otp, "login");
                if (!verification.success) return res.redirect(`/login?error=${verification.error}`);

                const result = await pool.query(`SELECT id, name FROM users WHERE email = $1`, [trimmedEmail]);
                if (result.rows.length === 0) return res.redirect("/login?error=invalid");

                const user = result.rows[0];
                req.session.userId = user.id;
                req.session.userName = user.name;
                return res.redirect("/");
            }
            // unknown login method
            return res.redirect("/login?error=server");
        } catch (error) {
            console.error("Error logging in : ", error);
            res.redirect("/login?error=server");
        }
    });
    
    app.get("/shop/:category", async (req, res) => {
        try {
            const category = req.params.category;
            const result = await pool.query(`SELECT id, name, slug, description, hero_image FROM categories WHERE slug = $1`, [category]);
            if (result.rows.length === 0) return res.status(404).send("Category not found.");
            const categoryData = result.rows[0];
            res.render("shop.ejs", {
                category : categoryData
            });
        } catch (error) {
            console.error("Error loading category: ", error);
            res.status(500).send("Something went wrong");
        }
    });
    
    app.get("/api/products", async (req, res) => {
        try {
            const { category, bestSeller } = req.query;
            const userId = req.session.userId || null;
            let query = `SELECT p.id, p.name, p.description, p.price, p.weight, p.image, p.category_id, c.name AS category_name, p.stock, 
                    p.is_best_seller, p.is_available, CASE WHEN f.id IS NOT NULL THEN true ELSE false END AS is_favourite FROM products p 
                    JOIN categories c ON p.category_id = c.id LEFT JOIN favourites f ON f.product_id = p.id AND f.user_id = $1 `;
            // const values = [];
            const values = [userId];
            const conditions = [];
            if (category) {
                values.push(category);
                conditions.push(`LOWER(c.name) = LOWER($${values.length}) `);
            }
            if (bestSeller === "true") {
                conditions.push(`p.is_best_seller = true `);
            }
            if (conditions.length > 0) {
                query += `WHERE ${conditions.join(" AND ")}`;
            }
            query += `ORDER BY p.id;`;
            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (error) {
            console.error("Error fetching products: ", error);
            res.status(500).json({error : "Failed to fetch products"});
        }
    });

    app.get("/api/products/:id", async (req, res) => {
        try {
            const {id} = req.params;
            const result = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);
            if (result.rows.length === 0) return res.status(404).json({error: "Product not found."});
            return res.json({
                product : result.rows[0]
            });
        } catch (error) {
            console.error("Error fetching product : ", error);
            return res.status(500).json({error: "Unable to load product."});
        }
    });

    app.post("/api/cart", async (req, res) => {
        try {
            // make sure the user is logged in
            if (!req.session.userId) return res.status(401).json({error: "You must be logged in to add items to your cart."});
            const {productId, quantity = 1} = req.body;

            const parsedProductId = Number(productId);
            const parsedQuantity = Number(quantity);

            // validate product id 
            if (!Number.isInteger(parsedProductId)) return res.status(400).json({ error: "Invalid product." });

            // validate quantity
            if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) {
                return res.status(400).json({
                    error: "Quantity must be between 1 and 20."
                });
            }
            // get product
            const productResult = await pool.query(`SELECT id, name, stock, is_available FROM products WHERE id = $1`, [parsedProductId]);
            if (productResult.rows.length === 0) {
                return res.status(404).json({
                    error: "Product not found."
                });
            }
            const product = productResult.rows[0];

            if (!product.is_available) {
                return res.status(400).json({
                    error: "This product is current unavailable."
                });
            }
            if (product.stock <= 0) {
                return res.status(400).json({
                    error: "This product is out of stock."
                });
            }

            // find the user's cart
            let cartResult = await pool.query(`SELECT id FROM cart WHERE user_id = $1`, [req.session.userId]);
            let cartId;

            // create cart if user doesn't have one 
            if (cartResult.rows.length === 0) {
                const newCart = await pool.query(`INSERT INTO cart (user_id) VALUES ($1) RETURNING id`, [req.session.userId]);
                cartId = newCart.rows[0].id;
            } else {
                cartId = cartResult.rows[0].id;
            }

            // check whether the product is already in the cart
            const cartItemResult = await pool.query(`SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [cartId, parsedProductId]);
            
            if (cartItemResult.rows.length > 0) {
                const cartItem = cartItemResult.rows[0];
                const newQuantity = cartItem.quantity + parsedQuantity;
                // respect stock
                if (newQuantity > product.stock) {
                    return res.status(400).json({
                        // error: `Only ${product.stock} of this product are available.`
                        error: `Only ${product.stock} of ${product.name} are available.`
                    });
                }
                // respect the max cart quantity
                if (newQuantity > 20) {
                    return res.status(400).json({
                        error: "You can add a maximum of 20 of this product."
                    });
                }
                await pool.query(`UPDATE cart_items SET quantity = $1 WHERE id = $2`, [newQuantity, cartItem.id]);
            } else {
                if (parsedQuantity > product.stock) {
                    return res.status(400).json({
                        error: `Only ${product.stock} of this product are available.`
                    });
                }
                await pool.query(`INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)`, [cartId, parsedProductId, parsedQuantity]);
            }

            // update cart's updated_at timestamp
            await pool.query(`UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [cartId]);
            return res.json({
                success: true,
                message: `${product.name} added to your cart.`
            });
        } catch (error) {
            console.error("Error adding product to cart : ", error);
            return res.status(500).json({error: "Failed to add item to cart."});
        }
    });

    app.post("/api/place-order", async (req, res) => {
        try {
            if (!req.session.userId) return res.status(401).json({ error: "You must be logged in to place an order." });
            const { paymentMethod, name, phone, address, city, state, pincode } = req.body;
            const shippingAddress = `${name}\n` + `${phone}\n` + `${address}, ${city}, ${state} - ${pincode}`;
            const validPaymentMethods = ["card", "upi", "cod"];

            if (!validPaymentMethods.includes(paymentMethod)) return res.status(400).json({ error: "Please select a valid payment method." });
            
            if (!name || !phone || !address || !city || !state || !pincode) {
                return res.status(400).json({ error: "Please complete all delivery details." });
            }

            const cartResult = await pool.query(`SELECT id FROM cart WHERE user_id = $1`, [req.session.userId]);
            if (cartResult.rows.length === 0) return res.status(400).json({ error: "Your cart is empty." });
            const cartId = cartResult.rows[0].id;

            // get the user's cart items and current product prices
            const itemsResult = await pool.query(`SELECT ci.product_id, ci.quantity, p.price
                FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1`, [cartId]);
            if (itemsResult.rows.length === 0) return res.status(400).json({ error: "Your cart is empty." });
            
            // calculate subtotal
            const subtotal = itemsResult.rows.reduce((total, item) => {
                    return total + Number(item.price) * item.quantity;
                }, 0);

            const gst = Math.round(subtotal * 0.05);
            const delivery = 50;
            const total = subtotal + gst + delivery;

            // generate a random Crumbelle order number
            const randomNumber = Math.floor( 100000 + Math.random() * 900000 );
            const orderNumber = `CRB${randomNumber}`;

            // save the order before clearing the cart
            await pool.query(`INSERT INTO orders (order_number, user_id, subtotal, gst, delivery_fee, total, status, shipping_address, 
                payment_method, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [orderNumber, req.session.userId, subtotal, gst, delivery, total, "confirmed", shippingAddress, paymentMethod, paymentMethod === "cod" ? "pending" : "paid"]);
            await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId] );
            await pool.query(`UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [cartId]);

            return res.json({
                success: true,
                orderNumber,
                paymentMethod,
                total
            });
        } catch (error) {
            console.error("Error placing order:", {
                message: error.message,
                detail: error.detail,
                code: error.code,
                constraint: error.constraint
            });
            res.status(500).json({ error: error.message });
        }
    });

    app.get("/api/favourites", async (req, res) => {
        try {
            if (!req.session.userId) return res.status(401).json({ error : "Please log in to view your favourites." });
            const result = await pool.query(`SELECT f.id AS favourite_id, f.product_id, f.created_at, p.name, p.price, p.image, 
                p.description, p.is_available, c.name AS category_name FROM favourites f JOIN products p ON f.product_id = p.id 
                LEFT JOIN categories c ON p.category_id = c.id WHERE f.user_id = $1 ORDER BY f.created_at DESC`, [req.session.userId]);
            res.json({
                favourites: result.rows
            });
        } catch (error) {
            console.error("Error fetching favourites : ", error);
            res.status(500).json({ error : "Unable to load your favourites." });
        }
    })

    app.get("/api/favourites/count", async (req, res) => {
        try {
            if (!req.session.userId) return res.json({ count: 0 });
            const result = await pool.query(`SELECT COUNT(*) FROM favourites WHERE user_id = $1`, [req.session.userId] );
            res.json({ count: Number(result.rows[0].count) });
        } catch (error) {
            console.error("Error fetching favourite count:", error);
            res.status(500).json({ error: "Unable to load favourite count." });
        }
    });

    app.post("/api/favourites", async (req, res) => {
        try {
            if (!req.session.userId) return res.status(401).json({ error : "Please log in to add your favourites."});
            const {productId} = req.body;
            if (!productId) return res.status(400).json({ error : "Product ID is required." });
            const result = await pool.query(`INSERT INTO favourites (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING RETURNING *`, [req.session.userId, productId]);
            res.status(201).json({
                message: "Added to favourites.",
                favourites : result.rows[0] || null 
            });
        } catch (error) {
            console.error("Error adding favourite : ", error);
            res.status(500).json({ error : "Unable to add product to favourites." });
        }
    });

    app.delete("/api/favourites/:productId", async (req, res) => {
        try {
            if (!req.session.userId) return res.status(401).json({ error : "Please log in to remove favourites." });
            const {productId} = req.params;
            const result = await pool.query(`DELETE FROM favourites WHERE user_id = $1 AND product_id = $2 RETURNING *`, [req.session.userId, productId]);
            if (result.rows.length === 0) return res.status(404).json({ error : "Favourite not found." });
            res.json({ message : "Removed from favourites." });
        } catch (error) {
            console.error("Error removing favourite : ", error);
            res.status(500).json({ error : "Unable to remove product from favourites." });
        }
    })

    app.post("/subscribe", (req, res) => {
        const email = req.body.email;
        console.log(`Email Id = `+ email);
    });
    
    app.listen(port, () => {
        console.log(`Server is listening on http://localhost/` + port + `...`);
    });
}

startServer();