import mongoose from "mongoose";

const printBatchSchema = mongoose.Schema({
    batchNumber: {
        type: String,
        required: true,
        unique: true
    },
    productCode: {
        type: String,
        required: true
    },
    voyageNumber: {
        type: String,
        required: true
    },
    printedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    printStatus: {
        type: String,
        enum: ["generated", "printed", "partially_printed", "failed"],
        default: "generated"
    },
    qrCodes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "PrintedQr"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const PrintBatch = mongoose.model("PrintBatch", printBatchSchema);
export default PrintBatch;