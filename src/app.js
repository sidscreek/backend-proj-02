import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
//to use middleware we have to use app.use
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
//just to specify the size of json
app.use(express.json({limit: "16kb"}));

//if we get the data from url it is encoded specially 
app.use(express.urlencoded({extended: true, limit: "16kb"}));

//to store the public assets such as files and pdf etc
app.use(express.static("public"))


//to use cookies 
app.use(cookieParser());


//routes import 
import userRouter from './routes/user.routes.js'


//routes declaration
//we need a middleware to call the router
app.use("/api/v1/users", userRouter)
// http://localhost:8080/users/register this is how url is made 



export {app};