import mongoose from "mongoose";

const lineSchema = mongoose.Schema({
    lineName: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    }
}, {
    timestamps: true
});

const Line = mongoose.model("Line", lineSchema);

export default Line;