import dotenv from "dotenv";
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import express from "express";
import connectDB from "./db/index.js";
const app = express();
dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.on("error",() => {
        console.log("err:",error);
        throw error;
    })
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running at port : ${process.env.PORT}`)
    });
})
.catch((err) => {
    console.log("Mongo DB connection failed !!!" , err);
})









// function connectDB(){}

// connectDB()
//IIFE
// ;( async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error" , () => {
//             console.log("err:" , error);
//             throw error;
//         })

//         app.listen(process.env.PORT, ()=> {
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
        
//     } catch (error) {
//         console.error("error" , error);
//     }
// })()