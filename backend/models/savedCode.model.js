import mongoose from "mongoose";

const savedCodeSchema = mongoose.Schema({
    productCode:{
        type: String,
        required: true
    },
    savedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},{
    timestamps: true
})

const SavedCode = mongoose.model("SavedCode", savedCodeSchema);

export default SavedCode;