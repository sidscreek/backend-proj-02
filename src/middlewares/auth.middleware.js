//this middleware will verify if the user is there or not 

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,res,next)=> {
    try {
        //we have the cookies access 
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");//extract the token
    
        if(!token)
        {
            throw new ApiError(401, "Unauthorised request");
        }
    
        //if we have the token , we have to ask the jwt if that token is correct or not 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user)
        {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        //finally we have the user 
        req.user = user;
        next();
        //these middlewares we have created are genrallu used in routes 
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
        
    }
    


})