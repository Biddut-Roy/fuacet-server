const express = require('express')
require('dotenv').config();
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion} = require('mongodb');

app.use(cors({
    origin: [ 'http://localhost:5173',
    'http://localhost:5174',
],
 credentials: true,
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

const user = client.db("fuacet").collection("user");
const fqa = client.db("fuacet").collection("fqa");
const Tdata = client.db("fuacet").collection("transaction");

// create  middleware

const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send({ message: 'not authorized' });
    }
    jwt.verify(token, process.env.APP_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized' });
        }
        req.user = decoded;
        next();
    })
};

const verifyAdmin = async (req, res, next) => {
    const email = req.user.email;
    const query = { email: email };
    const users = await user.findOne(query);
    const isAdmin = users?.role=== 'admin';
    if (!isAdmin) {
      return res.status(403).send({ message: 'forbidden access' });
    }
    next();
  }

//  auth token create
app.post("/jwt", async (req, res) => {
    const body = req.body;
    const token = jwt.sign(body, process.env.APP_TOKEN_SECRET, { expiresIn: '1h' });
    res
        .cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        })
        .send({ success: true })
})

// token clear
app.post('/logout', async (req, res) => {
    const body = req.body;
    res.clearCookie('token', {
        maxAge: 0,
        httpOnly: false,
        secure: true,
        sameSite: 'none'
    }).send({ clear: true });
})




app.get('/api/v1/user',verifyToken,verifyAdmin,async (req, res) => {
    const result = await user.find().toArray();
    res.send(result);
})

app.post('/api/v1/user', async (req, res) => {
    const body = req.body;
    const existingUser = await user.findOne({ email: body.email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const result = await user.insertOne(body);
    res.send(result);
})


app.get('/api/v1/fqa', async (req, res) => {
    const result = await fqa.find().toArray();
    res.send(result);
})

app.get('/api/v1/Transactions/:email',verifyToken,async (req, res) => {
    const email = req.params?.email;
    const query = { email:email };
    const result = await Tdata.find(query).toArray();
    res.send(result);
})

app.post('/api/v1/Transactions',verifyToken,async (req, res) => {
    const body = req.body;
    const saltRounds = 10;
    const hash = await bcrypt.hash("Nill", saltRounds);
    const hashData = hash.substring(0, 20);
    const setData = {
        address: body?.address,
        type: body?.type,
        amount: body?.amount,
        email: body?.email,
        date_time: body?.date_time,
        hash: hashData,
    }
    const result = await Tdata.insertOne(setData);
    res.send(result);
})

//  admin section

app.get('/api/v1/admin/:email',verifyToken,async (req, res) => {
    const email = req.params?.email;
    const query = { email:email };
    const users =await user.findOne(query);
    let isAdmin = false;
        if (users?.role === 'admin') {
            isAdmin = true
        }
 
    res.send({ isAdmin })
})


app.get('/', (req, res) => {
  res.send('Server working')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})