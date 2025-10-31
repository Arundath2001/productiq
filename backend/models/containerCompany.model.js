import mongoose from "mongoose";

const containerCompanySchema = mongoose.Schema({
    containerCompanyName: {
        type: String,
        reuqired: true,
        unique: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    lineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Line",
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    }

}, {
    timestamps: true
});

const ContainerCompany = mongoose.model("ContainerCompany", containerCompanySchema);

export default ContainerCompany;