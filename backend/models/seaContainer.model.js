import mongoose, { mongo } from "mongoose";

const seaContainerSchema = mongoose.Schema({
    containerNumber: {
        type: String,
        required: true
    },
    seaVoyageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SeaVoyage",
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    }
}, {
    timestamps: true
});

const SeaContainer = mongoose.model("SeaContainer", seaContainerSchema);

export default SeaContainer;