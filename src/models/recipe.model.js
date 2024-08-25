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
        category:{
            type:String,
            required:true,
            enum: ['breakfast','lunch','snack','dinner']
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
            required:true
        },
        recipeOwnerName:{
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        likedBy:{
            type: Schema.Types.ObjectId,
            ref: 'User',
           
        },
    },{timestamps: true})

recipeSchema.plugin(mongooseAggregatePaginate)

export const Recipe = mongoose.model('Recipe',recipeSchema)