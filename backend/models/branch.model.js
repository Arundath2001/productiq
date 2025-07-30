import mongoose from "mongoose";

const branchSchema = mongoose.Schema({
    branchName: {
        type: String,
        required: true,
        unique: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
},
    {
        timestamps: true
    });

branchSchema.index({ branchName: 1 });

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;