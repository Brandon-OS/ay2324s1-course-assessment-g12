const express = require("express");
const cors = require("cors");
const axios = require("axios");
var app = express();
const databaseURL = process.env.REACT_APP_ENV === 'local'
? 'http://localhost:3005'
: "http://database-service-service.default.svc.cluster.local:3005";
const PORT = 3002;
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.post("/question", authenticateToken, async (req, res) => {
    if (req.role != "admin")
        res.status(403).json({
            error: "You do not have the required permissions to add questions.",
        });
    const response = await axios.post(`${databaseURL}/question`, req.body);
    res.send(response.data);
});

app.get("/question", async (req, res) => {
    const response = await axios.get(`${databaseURL}/question`, {
        params: req.query,
    });
    res.send(response.data);
});

app.patch("/question", async (req, res) => {
    const response = await axios.patch(`${databaseURL}/question`, req.body);
    res.send(response.data);
});

app.delete("/question", async (req, res) => {
    /** 
    if (req.role != "admin")
        res.status(403).json({
            error: "You do not have the required permissions to delete questions.",
        });
        */
    const response = await axios.delete(`${databaseURL}/question`, {
        params: req.query,
    });
    res.send(response.data);
});

app.get("/questions", async (req, res) => {
    const response = await axios.get(`${databaseURL}/questions`);
    res.send(response.data);
});

app.get("/questions/filter", async (req, res) => {
    try {
        const response = await axios.get(`${databaseURL}/questions/filter`, {
            params: req.query,
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error(error);
    }
});

app.post("/question/visit", async (req, res) => {
    try {
        const response = await axios.post(
            `${databaseURL}/question/visit`,
            req.body
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error(error);
    }
});

app.post("/question/like", async(req, res) => {
    try {
        const email = req.body.email;
        const userData = await axios.get(`${databaseURL}/user`, {params: {email: email}});
        const username = userData.data.username;
        const response = await axios.post(`${databaseURL}/question/like`, 
                {username: username, title: req.body.title, liked: req.body.liked});
        res.send(response.data);
    } catch (error) {
        console.error (error)
    }
})

app.get("/questions/like", async(req, res) => {
    try {
        const email = req.query.email;
        const userData = await axios.get(`${databaseURL}/user`, {params: {email: email}});
        const username = userData.data.username;
        const response = await axios.get(`${databaseURL}/questions/like`, {params: {username: username}});
        res.send(response.data);
    } catch (error) {
        console.error(error);
    }
})

app.get("/", async(req, res) => {
    console.log("Hello from question service!")
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) return res.sendStatus(403);
        req.user = payload.username;
        req.role = payload.role;
        next();
    });
}



app.listen(PORT, () => {
    console.log("Listening on port " + PORT);
});
