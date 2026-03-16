const express = require('express')
const SSLCommerzPayment = require('sslcommerz-lts');
const { v4: uuidv4 } = require('uuid');
const app = express()
const cors = require('cors');
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://travel-planning-ivory.vercel.app'
    ],
    credentials: true
}));
app.use(express.json())
require('dotenv').config()
const port = process.env.PORT || 5000

//store id
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false;
//
app.get('/', (req, res) => {
    res.send('Hello World!')
})

//connect mongodb connection

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r1svgo6.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const database = client.db('Travel');
        const AllUser = database.collection('users');
        const AllMessage = database.collection("message");
        const ProductInfo = database.collection("product");
        const blogPost = database.collection("blog");
        const reviewInfo = database.collection("review");
        const allCardData = database.collection("card");
        const AllWishlist = database.collection("wishlist");
        const orderCollection = database.collection("order")
        app.post("/All_users", async (req, res) => {
            try {
                const userData = req.body;

                const existUser = await AllUser.findOne({ email: userData.email });

                if (existUser) {
                    return res.status(200).json({
                        message: "User already exists",
                        user: existUser,
                    });
                }


                const result = await AllUser.insertOne(userData);

                res.status(201).json({
                    message: "User created successfully",
                    result,
                });

            } catch (error) {
                console.error("Error creating user:", error);
                res.status(500).json({ error: "Failed to create user" });
            }
        });

        app.post("/login-user", async (req, res) => {
            const { email } = req.body;
            const user = await AllUser.findOne({ email: email });

            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }
            res.send(user);
        });
        app.get("/reset/:email", async (req, res) => {
            const email = req.params.email;
            const result = await AllUser.findOne({ email: email });
            if (!result) {
                return res.status(404).json({ message: "User not found" });
            }

            res.send(result);
        })
        // Add this route to your Express server
        app.post("/store-reset-token", async (req, res) => {
            const { email, token } = req.body;

            try {
                // Set expiration for 1 hour from now
                const expires = new Date(Date.now() + 3600000);

                const result = await AllUser.updateOne(
                    { email: email },
                    {
                        $set: {
                            resetToken: token,
                            resetTokenExpiry: expires
                        }
                    }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: "User not found" });
                }

                res.status(200).json({ message: "Token stored successfully" });
            } catch (error) {
                res.status(500).json({ error: "Failed to store token" });
            }
        });
        //update password
        app.post("/update-password", async (req, res) => {
            const { token, passwordHashed } = req.body;
            try {
                const user = await AllUser.findOne({
                    resetToken: token,
                    resetTokenExpiry: { $gt: new Date() }
                })
                if (!user) {
                    return res.status(400).json({
                        message: "Token is invalid or has expired."
                    })
                }
                await AllUser.updateOne(
                    { _id: user._id },
                    {
                        $set: { password: passwordHashed }
                    }
                );

                res.status(200).json({ success: true, message: "Password updated successfully" });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        })
        //message save
        app.post("/message", async (req, res) => {
            try {
                const messageData = req.body;
                console.log(messageData);

                const result = await AllMessage.insertOne(messageData)
                res.send(result)
            } catch (error) {
                console.error("ডাটাবেস সেভ করতে সমস্যা:", error);

            }
        })
        // product data thunder client
        app.post("/product-data", async (req, res) => {
            const productData = req.body;
            const result = await ProductInfo.insertOne(productData);
            res.send(result)

        })
        app.get("/productAll", async (req, res) => {
            const allProduct = await ProductInfo.find().toArray();
            res.send(allProduct)
        })
        //
        app.post("/blog-post", async (req, res) => {
            const blogData = req.body;
            const result = await blogPost.insertOne(blogData);
            res.send(result)
        })
        app.get("/AllBlog", async (req, res) => {
            const allBlog = await blogPost.find().toArray();
            res.send(allBlog)
        })
        app.post("/review", async (req, res) => {
            const reviewData = req.body;
            const result = await reviewInfo.insertOne(reviewData);
            res.send(result)
        });
        app.get("/allReview/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const query = { productId: id };

                const reviewAll = await reviewInfo.find(query).toArray();

                res.send(reviewAll);
            } catch (error) {
                res.status(500).send({ message: "Error fetching reviews", error });
            }
        });
        // cart
        app.post("/cart-data", async (req, res) => {
            const allCardInfo = req.body;
            const result = await allCardData.insertOne(allCardInfo);
            res.send(result)
        })
        app.get("/allCard/:email", async (req, res) => {
            const email = req.params.email;

            const allCard = await allCardData.find({ email: email }).toArray();
            res.send(allCard)
        });
        app.delete("/removeCard/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allCardData.deleteOne(query);
            res.send(result)

        })
        app.post("/wishlist", async (req, res) => {
            const wishlistData = req.body;
            const result = await AllWishlist.insertOne(wishlistData);
            res.send(result)
        });
        app.get("/allWishlist/:email", async (req, res) => {
            const email = req.params.email;
            const allCard = await AllWishlist.find({ email: email }).toArray();
            res.send(allCard)
        });
        app.delete("/deleteWishlist/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await AllWishlist.deleteOne(query);
            res.send(result)
        })
        //payment
        // payment init route
        app.post('/init', async (req, res) => {
            const transactionId = uuidv4();
            const productInfo = req.body;
            const { productName, price, customerName, email, address, phone } = req.body;


            if (!price || price < 10) {
                return res.status(400).send({ message: "Price must be at least 10 BDT" });
            }

            const data = {
                total_amount: price,
                currency: 'BDT',
                tran_id: transactionId,
                success_url: `${process.env.SERVER_Base_Url}/payment/success/${transactionId}`,
                fail_url: `${process.env.SERVER_Base_Url}/payment/fail/${transactionId}`,
                cancel_url: `${process.env.SERVER_Base_Url}/payment/cancel`,
                ipn_url: `${process.env.SERVER_Base_Url}/ipn`,
                shipping_method: 'Courier',
                product_name: productName || 'Travel Package',
                product_category: 'Service',
                product_profile: 'general',
                cus_name: customerName || 'Unknown',
                cus_email: email || 'test@test.com',
                cus_add1: address || 'Dhaka',
                cus_phone: phone || '01700000000',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: '1000',
                ship_country: 'Bangladesh',
            };

            try {
                const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
                sslcz.init(data).then(apiResponse => {
                    if (apiResponse?.GatewayPageURL) {
                        res.send({ url: apiResponse.GatewayPageURL });
                        const order = { productInfo, paidStatus: false, transactionId: transactionId }
                        const result = orderCollection.insertOne(order)
                    } else {

                        console.error("SSLCommerz API Error:", apiResponse);
                        res.status(400).send({ message: "SSLCommerz init failed", error: apiResponse });
                    }
                });
            } catch (error) {
                res.status(500).send({ message: "Internal server error", error: error.message });
            }
        });

        app.post("/payment/success/:tranId", async (req, res) => {
            const { tranId } = req.params;
            console.log("Payment successful for Transaction ID:", tranId);

            try {
                // ১. ডাটাবেস আপডেট করুন
                const result = await orderCollection.updateOne(
                    { transactionId: tranId },
                    { $set: { paidStatus: true } }
                );


                return res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment_success`);

            } catch (error) {
                console.error("Database update error:", error);

                res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment-fail`);
            }
        });


        app.post("/payment/fail/:tranId", async (req, res) => {
            res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment-fail`);
        });



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
