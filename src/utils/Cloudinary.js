import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded
        console.log("File is uploaded on cloudinary", response.url);
        return response; 
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temp file 
        return null; 
    }
}

export {uploadOnCloudinary};


    //how to upload a file in production grade setting 
    //we use multer 
    //first we bring file to our local storage and then upload it to the file here server 
    //dont directly upload it to server 


    
    