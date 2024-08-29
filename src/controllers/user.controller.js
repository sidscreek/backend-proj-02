import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        if(!user)
        {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //add the refresh token to the user
        user.refreshToken = refreshToken

        //save the user now without any validation
        await user.save({validateBeforeSave: true})

        //return both 
        return { accessToken, refreshToken }
    } catch (error) {
        console.error("Error while generating tokens:", error);
        throw new ApiError(500, "Something went wrong while generating tokens");

    }
}

const registerUser = asyncHandler( async (req,res) => {
    //register of user 
    //break into small sub problems and write the code 
    //01 : get user details from frontend 
    //here we can use postman as we dont have a frontend ready
    //the data we take depends on the schema as well
    //02: validation required
    //03: check if user already exists: username,email
    //04: check for details we are taking from like images and avatars
    //05: if availabale upload them to cloudinary
    //06: create user objects since in mongo db being a no sql db , objects are created and then sent
    //07: remove password and refresh token feed from the response we get
    //08: check for user creation and return it else return null


    //get the user details from frontend
    const {fullname, email,username,password} = req.body
    console.log("Email:" , email);
    //validation
    // if(fullname === ""){
    //     throw new ApiError(400, "fullname is required")
    // }
    //this is how to do from basic 
    
    //but there are many if else we have to perform for different fields 
    //so to check for multiple if else 
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400 , "all fields are required")
    }

    //email matching
    const existedUser = await User.findOne({
        $or:[{ username }, { email }]
    })
    //if match found throw new error
    if(existedUser)
    {
        throw new ApiError(409, "User already exists")
    }

    //we are using multer to store images and files 
    //so images[0] will give the path of that image 

    const avatarLocalPath = req.files?.avatar[0]?.path 
    //this means it is on our server and has not been uploaded to cloudnary yet
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is required")
    }

    // if(!coverImageLocalPath)
    // {
    //     throw new ApiError(400, "Cover image is required");
    // }

    //now upload on cloudinary server 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
    {
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url, //we just need the url of the object 
        coverImage: coverImage?.url || "", //not compulsory to store coverImage
        email,
        password,
        username: username.toLowerCase()
    })

    //check if user is created or not and remove all the password associated with it 
    const createdUser = await User.findById(user._id).select(
        //mention all those attributes which we dont need 
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})
 
//creation of login user 
const loginUser = asyncHandler(async (req,res) => {
    //access data from req body
    //check if username is there 
    //it depends on u what type of access you want to give to the user, can be either username or email
    //find the user
    //password check
    //access and refresh token generate 
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if(!username && !email)
    {
        throw new ApiError(400, "Username or email is required");   
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user)
    {
        throw new ApiError(404, "User does not exist");
    }
    //check if password is correct 

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {refreshToken, accessToken } = await generateAccessAndRefereshTokens(user._id);
    
    //update the user 

    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    //send the cookies
    const options = {
        //bydefault cookies can be modified at frontend 
        httpOnly: true,
        secure: true,
        //after these 2 parameters now the cookies can be modified at server only
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
})

//creation of loggedout user 

const logoutUser = asyncHandler( async(req,res) =>{
    //think about how the user would log out 
    //you can either remove the cookies 
    //or
    //reset the refresh token 
    //we need user id 
    //but how??
    //here comes the concept of middleware so design your own middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        //bydefault cookies can be modified at frontend 
        httpOnly: true,
        secure: true,
        //after these 2 parameters now the cookies can be modified at server only
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))


})

//creation of refresh token

const refreshAccessToken = asyncHandler( async(req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401, "unauthorized request")
    }
    //verify it 
   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id);
     if(!user)
     {
         throw new ApiError(401, "Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken)
     {
         throw new ApiError(401,"refresh token is expired or used");
     }
 
     //generate tokens 
     const options = {
         httpOnly: true,
         secure: true,
     }
 
     const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(
             200,
             {accessToken,refreshToken: newRefreshToken},
             "Access token refreshed"
         )
     )
 
   } catch (error) {
    
    throw new ApiError(401, error?.message || "Invalid refresh token");    
   }

})

const changeCurrentPassword = asyncHandler( async(req,res)=> {
    const { oldPassword, newPassword} = req.body;

    //user can change the password then it must be logged in 
    //here if loggedin then comes the use of middleware 
    //through middleware we can access user 
    //if middleware has been used then user information we have and can access its id 
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Invalid Old Password");
    }

    //set the new password and save it
    user.password = newPassword
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))


})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

//think about what all features we are giving access to the user 

//updation of text based data 
const updateAccountDetails = asyncHandler( async(req,res)=> {
    const { fullname, email} = req.body
    if(!fullname || !email)
    {
        throw new ApiError(400, "All fields are required");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            //mongo db aggreration pipelines 
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, "Account details updated successfully"))

})

const updateUserAvatar = asyncHandler( async(req,res) =>{
    //we need access of files 
    //here comes multer middleware
    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath)
    {
        throw new ApiError(404,"Avatar file is missing");
    }

    //upload this file on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    //if the url is missing 

    if(!avatar.url)
    {
        throw new ApiError(404, "Error while uploading avatar");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            //update
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    //send the response

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "avatar uploaded successfully")
    )
})

const updateUserCoverImage = asyncHandler( async(req,res) =>{
    //we need access of files 
    //here comes multer middleware
    const coverImageLocalPath = req.file?.path
    
    if(!coverImageLocalPath)
    {
        throw new ApiError(404,"CoverImage file is missing");
    }

    //upload this file on cloudinary 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    //if the url is missing 

    if(!coverImage.url)
    {
        throw new ApiError(404, "Error while uploading cover image");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            //update
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "coverImage uploaded successfully")
    )
})

const getUserChannelProfile = asyncHandler( async(req,res)=>{
    //we need the url her 
    const { username } = req.params 

    if(!username?.trim())
    {
        throw new ApiError(404, "username is missing")
    }

    //method 1 to find username from user
    // User.find({ username })

    //also can use aggregation pipeline
    const channel = await User.aggregate([
        {
            //first field : match
            $match:{
                username: username?.toLowerCase()

            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, //now we got the number of subscribers similarly what do you need to find uska aggregation pipeline laga do
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            //if you want to add 2 fields
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "subscribedTo"
                },
                isSubscriber: {
                   $cond:{
                    //here we have to check if I am subscribed or not 
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false

                   }
                }
            }
        },
        {
            //fields which we have to pass on next stage
            $project:{
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscriber: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if(!channel?.length)
    {
        throw new ApiError(404,"Channel dosent exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};