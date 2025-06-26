import mongoose from "mongoose";

const companySchema = mongoose.Schema({
    companyCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        minlength: 2,
        maxlength: 10,
        match: /^[A-Z0-9\s_-]+$/ // Added \s to allow spaces along with letters, numbers, underscores, and hyphens
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

// Index for better performance
companySchema.index({ companyCode: 1 });

const Company = mongoose.model("Company", companySchema);

export default Company;