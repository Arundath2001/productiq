// import mongoose from "mongoose";

// const printedQrSchema = mongoose.Schema({
//     productCode:{
//         type: String,
//         required: true
//     },
//     voyageNumber:{
//         type: String,
//         required: true
//     },
//     quantity:{
//         type: Number,
//         required: true
//     },
//     printedAt:{
//         type: Date,
//         default: Date.now
//     },
//     printedBy:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     }
// })

// const PrintedQr = mongoose.model("PrintedQr", printedQrSchema);

// export default PrintedQr;

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
    qrImage: {
        type: String,
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

const PrintedQr = mongoose.model("PrintedQr", printedQrSchema);

export default PrintedQr;