import mongoose from "mongoose";

const packageSchema = mongoose.Schema({
    voyageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voyage",
        required: true
    },
    goniId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goni",
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    },
    packageWeight: {
        type: Number,
        default: 0
    },
    goniNumber: {
        type: Number,
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UploadedProduct",
    }],
    packagedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["packed", "shipped"],
        default: "packed"
    },
    packagedDate: {
        type: Date,
        default: Date.now
    },
    shippedDate: {
        type: Date,
    }
}, {
    timestamps: true
});

packageSchema.index({ voyageId: 1, goniId: 1, goniNumber: 1 }, { unique: true });

const Package = mongoose.model("Package", packageSchema);

export default Package;