const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const cors = require('cors');


app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

//connect mongodb connection

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://TravelPlanning:MVHJOHnrJSGPwv0h@cluster0.r1svgo6.mongodb.net/?appName=Cluster0`;

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
        const blogPost=database.collection("blog")
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
        app.post("/update-password", async(req, res) => {
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
        app.post("/message",async (req, res) => {
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
        app.get("/productAll", async(req, res) => {
            const allProduct = await ProductInfo.find().toArray();
            res.send(allProduct)
        })
        //
        app.post("/blog-post", async(req, res) => {
            const blogData = req.body;
            const result = await blogPost.insertOne(blogData);
            res.send(result)
        })
        app.get("/AllBlog", async (req, res) => {
            const allBlog = await blogPost.find().toArray();
            res.send(allBlog)
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
