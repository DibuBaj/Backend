import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
        },
        picture:{
            type:String, //cloudnary url
            required:true
        },
        description:{
            type:String,
            required:true,
        },
        rating:{
            type:Number,
            default: 0,
            required: true
        },
        productOwner:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    },{timestamps: true})

productSchema(mongooseAggregatePaginate)

export const Product = mongoose.model('Product',productSchema)