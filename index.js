const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

//connect mongodb

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.r1svgo6.mongodb.net/?appName=Cluster0`;

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
        // app.post("/All_users", async (req, res) => {
        //     try {
        //         const userData = req.body;
        //         const exitUser = await AllUser.findOne({ email: userData.email });
        //         if (exitUser) {
        //             return res.status(400).json({ message: "email already exist" })
        //         }
        //         const result = await AllUser.insertOne(userData);
        //         res.send(result)
        //     } catch (error) {
        //         console.error('Error creating user:', error)
        //         res.status(500).json({ error: 'Failed to create user' })
        //     }

        // });
        app.post("/login-user", async (req, res) => {
            const { email } = req.body;
            const user = await AllUser.findOne({ email: email });

            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }
            res.send(user);
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
