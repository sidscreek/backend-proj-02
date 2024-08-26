import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n Mongo DB connected !!! DB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("Mongo db connection failed...", error);
        process.exit(1);
    }
} 
//this is acting like a handler essentially 
//we have to communicate with the database manytimes 
//everytime to connect this database we have to write this code 
//to avoid this create a utitlity file which provide this wrapper function 
//and whenever we have to use it the utility file will provide this wrapper function

export default connectDB;

