import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const existedUser = User.findOne({
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
 

export { registerUser };