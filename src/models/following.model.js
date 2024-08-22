import mongoose,{Schema} from "mongoose";

const followingSchema = new Schema({
    follower:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    profile:{
        type: Schema.Types.ObjectId,
        ref:"User"
    }    
},{timestamps: true})

export const Following = mongoose.model('Following',followingSchema)