const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8000;
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gf8ipgr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();



    const userCollection = client.db("TaskFlow").collection("users");


    // user api

    app.get('/users' , async (req, res) => {
        // console.log(req.headers.authorization)
        const users = await userCollection.find().toArray(); 
        res.send(users);
    })
    
    app.get('/users/:email',   async (req, res) => {
        const users = await userCollection.find({email: req.params.email}).toArray();
        res.send(users);
    })

    app.post('/users', async (req, res) => {
        const newUser = req.body;
        const result = await userCollection.insertOne(newUser);
        console.log('got new user', req.body);
        res.json(result);
    })
 

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send("TaskFlow server is running");
})

app.listen( port, () =>{
    console.log(`TaskFlow Server Port : ${port}`);
})
