import mongoose, { Schema } from "mongoose";

const PlalistSchema = new Schema(
    {   
        name:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: true
        },
        videos: [{
            type: Schema.Types.ObjectId,
            ref: "Video",
        }],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
        
    },{
        timestamps: true,
    }
)

export const Plalist = mongoose.model("Plalist", PlalistSchema);