import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name: 'dcbqepu2h', 
    api_key: '151148522149379', 
    api_secret: '<your_api_secret>' // Click 'View API Keys' above to copy your API secret
});



    //how to upload a file in production grade setting 
    //we use multer 
    //first we bring file to our local storage and then upload it to the file here server 
    //dont directly upload it to server 
    