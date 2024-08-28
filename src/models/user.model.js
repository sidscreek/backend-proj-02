import mongoose, { mongo, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";



const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            //to make any field searchable we need its index to be true so that it comes inside the database and is more optimsized 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage:{
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String, //always store the password in encrypted form 
            required: [true, 'Password is required']
        },

        refreshToken: {
            type: String,
        }
    },
    {
        timestamps: true
    }
)
//we are using this hook to perform an action before the final task is achieved 
//this is acting kind of middleware so we are using next here 

userSchema.pre("save", async function(next) {
    //password field ko leke usko encrypt karke save kardo
    //but first check if we really want to access the password 
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//we can design our own custom methods as well 
userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}

//Access tokens are short lived 
//as long as we have access token , features which require access tokens to access that particular resource 
//ex : file upload
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
//Refresh tokens are long lived 
//saved in both database and given to user 
//after your token expire refresh token will let you access that feature if you hit that particular endpoint , you no need to 
//login again or enter password again
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

} //both these two are jwt tokens

//jwt is like a key given to users , those users who havr that key will be given access to that token 

export const User = mongoose.model('User', userSchema);