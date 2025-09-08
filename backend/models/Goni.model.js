import mongoose from "mongoose";

const goniSchema = mongoose.Schema({
    goniName: {
        type: String,
        required: true,
        unique: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Company'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Branch'
    }
}, {
    timestamps: true
});

const Goni = mongoose.model("Goni", goniSchema);

export default Goni;