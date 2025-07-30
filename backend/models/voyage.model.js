import mongoose from "mongoose";

const voyageSchema = mongoose.Schema({
    voyageName: {
        type: String,
        required: true
    },
    voyageNumber: {
        type: String,
        required: true,
        unique: true
    },
    year: {
        type: Number,
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
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
    lastPrintedCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

voyageSchema.virtual('uploadedProducts', {
    ref: 'UploadedProduct',
    localField: '_id',
    foreignField: 'voyageId'
});

voyageSchema.set('toJSON', { virtuals: true });
voyageSchema.set('toObject', { virtuals: true });

const Voyage = mongoose.model("Voyage", voyageSchema);

export default Voyage;