import mongoose from "mongoose";

const printedQrSchema = mongoose.Schema({
    productCode: {
        type: String,
        required: true
    },
    voyageNumber: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    printedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    printStatus: {
        type: String,
        enum: ["generated", "printed", "failed"],
        default: "generated"
    },
    printAttempts: {
        type: Number,
        default: 1
    },
    lastPrintAttempt: {
        type: Date,
        default: Date.now
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PrintBatch"
    },
    printedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

printedQrSchema.virtual('qrData').get(function() {
    const sequenceNumber = this.quantity.toString().padStart(2, "0");
    return `${this.productCode}|${sequenceNumber}|${this.voyageNumber}`;
});

printedQrSchema.set('toJSON', { virtuals: true });
printedQrSchema.set('toObject', { virtuals: true });

printedQrSchema.index({ productCode: 1, voyageNumber: 1 });
printedQrSchema.index({ batchId: 1 });
printedQrSchema.index({ printStatus: 1 });

const PrintedQr = mongoose.model("PrintedQr", printedQrSchema);

export default PrintedQr;