import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const recipeSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
        },
        picture:{
            type:String, //cloudnary url
            required:true
        },
        pictureId:{
            type:String, 
        },
        description:{
            type:String,
            required:true,
        },
        ingredients:{
            type:Array,
            required: true
        },
        instructions:{
            type:Array,
            required: true
        },
        recipeOwner:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    },{timestamps: true})

recipeSchema.plugin(mongooseAggregatePaginate)

export const Recipe = mongoose.model('Recipe',recipeSchema)