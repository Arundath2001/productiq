import mongoose from "mongoose";

const printedQrSchema = mongoose.Schema({
    productCode:{
        type: String,
        required: true
    },
    voyageNumber:{
        type: String,
        required: true
    },
    quantity:{
        type: Number,
        required: true
    },
    printedAt:{
        type: Date,
        default: Date.now
    },
    printedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

const PrintedQr = mongoose.model("PrintedQr", printedQrSchema);

export default PrintedQr;