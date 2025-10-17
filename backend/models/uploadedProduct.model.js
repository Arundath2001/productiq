import mongoose from "mongoose";

const uploadedProductSchema = mongoose.Schema({
    productCode: {
        type: String,
        required: true
    },
    sequenceNumber: {
        type: Number,
        required: true
    },
    voyageNumber: {
        type: String,
        required: true
    },

    trackingNumber: {
        type: String,
        required: true,
    },
    clientCompany: {
        type: String,
        required: true
    },
    voyageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voyage",
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    image: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    },
    uploadedDate: {
        type: Date,
        default: Date.now
    },
    weight: {
        type: Number,
        required: true
    },
    exportedDate: {
        type: Date
    }
}, {
    timestamps: true
});

uploadedProductSchema.virtual('compositeCode').get(function () {
    return `${this.productCode}|${this.sequenceNumber}|${this.voyageNumber}`;
});

uploadedProductSchema.index({ voyageId: 1 });
uploadedProductSchema.index({ clientCompany: 1 });
uploadedProductSchema.index({ status: 1 });
uploadedProductSchema.index({ trackingNumber: 1 });
uploadedProductSchema.index({ productCode: 1 });
uploadedProductSchema.index({ sequenceNumber: 1 });
uploadedProductSchema.index({ voyageNumber: 1 });

uploadedProductSchema.index({
    productCode: 1,
    sequenceNumber: 1,
    voyageNumber: 1
}, { unique: true });

uploadedProductSchema.set('toJSON', { virtuals: true });
uploadedProductSchema.set('toObject', { virtuals: true });

const UploadedProduct = mongoose.model("UploadedProduct", uploadedProductSchema);

export default UploadedProduct;