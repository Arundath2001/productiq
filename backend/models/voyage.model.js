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
    lastPrintedCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

voyageSchema.virtual('delayDays').get(function () {
    if (this.originalExpectedDate && this.expectedDate) {
        const original = new Date(this.originalExpectedDate);
        const current = new Date(this.expectedDate);
        const diffTime = current - original;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
    return 0;
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