import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express";
const app = express();

// function connectDB(){}

// connectDB()
//IIFE
;( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error" , () => {
            console.log("err:" , error);
            throw error;
        })

        app.listen(process.env.PORT, ()=> {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
        
    } catch (error) {
        console.error("error" , error);
    }
})()