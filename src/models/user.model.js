import mongoose, { mongo, Schema } from "mongoose";


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


export const User = mongoose.model('User', userSchema);