import mongoose from "mongoose";

const seaVoyageSchema = mongoose.Schema({
    seaVoyageName: {
        type: String,
        required: true
    },
    seaVoyageNumber: {
        type: String,
        required: true,
        unique: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    },
    lineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Line",
        required: true
    },
    year: {
        type: Number,
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
    },
    trackingStatus: {
        type: String,
        enum: ["created", "dispatched", "delayed", "received"],
        default: "created"
    },
    dispatchDate: {
        type: Date,
        required: false
    },
    receivedDate: {
        type: Date,
        required: false
    },
    originalExpectedDate: {
        type: Date,
        required: false
    },
    expectedDate: {
        type: Date,
        required: false
    },
    delayDate: {
        type: Date,
        required: false
    },
    delayMessage: {
        type: String,
        required: false,
        maxLength: 500
    },
    location: {
        type: String,
        required: true,
        default: "Libya"
    },
}, {
    timestamps: true
});

const SeaVoyage = mongoose.model("SeaVoyage", seaVoyageSchema);

export default SeaVoyage;