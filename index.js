const express = require('express')
require('dotenv').config();
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
    origin: [ 'http://localhost:5173',
    'http://localhost:5174',
],
}));
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.malve12.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const dbConnect = async () => {
    try {
        client.connect()
        console.log('DB Connected Successfully✅')
    } catch (error) {
        console.log(error.name, error.message)
    }
}
dbConnect()

const fqa = client.db("fuacet").collection("fqa");
const transaction = client.db("fuacet").collection("transaction");

app.get('/api/v1/fqa', async (req, res) => {
    const result = await fqa.find().toArray();
    res.send(result);
})
app.post('/api/v1/Transaction', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = await transaction.insertOne(body);
    res.send(result);
})


app.get('/', (req, res) => {
  res.send('Server working')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})