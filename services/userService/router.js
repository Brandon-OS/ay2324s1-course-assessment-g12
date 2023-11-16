require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const axios = require("axios");
const cors = require("cors");

const PORT = 3001;
const databaseURL = process.env.REACT_APP_ENV === 'local'
? 'http://localhost:3005'
: process.env.REACT_APP_ENV === 'docker'
? 'http://database:3005'
: "http://database-service-service.default.svc.cluster.local:3005";
const jwt = require('jsonwebtoken');

var app = express();
app.use(express.json());
app.use(cors());

app.use(async (req, res, next) => {
    try {
        var accessToken = null;
        const hostPort = req.headers.host.split(':')[1];
        const allowedPorts = ['3001', '3002', '3003', '3005'];

        if (allowedPorts.includes(hostPort)) {
            next();
        } else {
            if (req.headers.authorization) accessToken = req.headers.authorization.split('Bearer ')[1];
            const isAuthenticated = await axios.get(`${databaseURL}/user/authenticate`, { params: req.query, headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (isAuthenticated.data) next();
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            res.status(error.response.status).json({ error: error.response.data.error })
        } else console.error(error)
    }
});

// ------------------ User Functions ------------------

app.delete("/user", async (req, res) => {
    try {
        const response = await axios.delete(`${databaseURL}/user`, { params: req.query, headers: req.headers });
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/user", async (req, res) => {
    try {
        console.log("posting user")
        const data = req.body;
        const response = await axios.post(`${databaseURL}/user`, data, {headers: req.headers});
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.get("/user", async (req, res) => {
    try {
        console.log("get user")
        const response = await axios.get(`${databaseURL}/user`, { params: req.query, headers: req.headers });
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.patch("/user", async (req, res) => {
    try {
        const response = await axios.patch(`${databaseURL}/user`, req.body, {headers: req.headers});
        res.send(response.data);
    } catch (error) {
        console.error(error);
    }
});

app.get("/user/check/email", async (req, res) => {
    try {
        const response = await axios.get(`${databaseURL}/user/check/email`, { params: req.query, headers: req.headers});
        res.send(response.data);
    } catch (error) {
        console.error(error);
    }
});

app.get("/user/check/username", async (req, res) => {
    try {
        const response = await axios.get(`${databaseURL}/user/check/username`, { params: req.query, headers: req.headers });
        res.send(response.data);
    } catch (error) {
        console.error(error);
    }
});

app.get("/user/verify", async (req, res) => {
    try {
        const response = await axios.get(`${databaseURL}/user/verify`, { params: req.query, headers: req.headers });
        res.send(response.data);
    } catch (error) {
        console.error(error);
    }
});

app.post("/token", async (req, res) => {
    try {

        const userData = await axios.get(`${databaseURL}/user`, { params: req.body, headers: req.headers });
        const refreshToken = userData.refreshToken;
        if (refreshToken === null) return res.sendStatus(401);
        const payload = {
            username: userData.username,
            email: userData.email,
            role: userData.role
        }
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.json({ accessToken: accessToken });
    } catch (error) {
        console.error(error);
    }
})

app.post("/signup", async (req, res) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const role = req.body.role;

        const payload = {
            username: username,
            email: email,
            role: role
        }

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
        res.json({ accessToken: accessToken, refreshToken: refreshToken })
    } catch (error) {
        console.error(error);
    }
})

app.post('/user/question', async (req, res) => {
    try {
        const response = await axios.post(`${databaseURL}/user/question`, req.body, {headers: req.headers});
        res.send(response.data);
    } catch (error) {
        console.error(error);
    }
})

app.get('/user/questions', async (req, res) => {
    try {
        const response = await axios.get(`${databaseURL}/user/questions`, { params: req.query, headers: req.headers });
        res.send(response.data);
    } catch (error) {
        console.error(error);
    }
})

app.get('/user/authenticate', async (req, res) => {
    try {
        const userData = await axios.get(`${databaseURL}/user`, { params: req.query, headers: req.headers });
        if (userData.data.role === 'admin') {
            res.send(true);
        } else {
            res.send(false);
        }
    } catch (error) {
        console.error(error)
    }
})

app.get("/", (req, res) => {
    console.log("Hello from user service!")
})

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});