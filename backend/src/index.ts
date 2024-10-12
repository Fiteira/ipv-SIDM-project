import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
const passport = require('./config/passport.config');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
//app.use(passport.initialize());


let date = new Date();
console.log("Date: " + date)


app.use((req : Request, res : Response, next) => {
  console.log(` ${req.method} ${req.url}`);
  next();
});

/*
// define the routes for the API
require("./routes/auth.routes")(app)
require("./routes/user.routes")(app)
*/

app.listen(PORT, () => {
  console.log(`API listening on port: ${PORT} `)
})

app.get('/', (req  : Request , res : Response ) => {
  res.json({ message: "Hello World!" });
})


module.exports = app