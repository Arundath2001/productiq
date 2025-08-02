import mongoose from "mongoose";

const branchSchema = mongoose.Schema({
    branchName: {
        type: String,
        required: true,
        unique: true,
    },
    countryCode: {
        type: String,
        required: true,
        uppercase: true,
        minlength: 2,
        maxlength: 3,
        validate: {
            validator: function (v) {
                return /^[A-Z]{2,3}$/.test(v);
            },
            message: 'Country code must be 2-3 uppercase letters (ISO format)'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true
});

branchSchema.index({ branchName: 1, countryCode: 1 });

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;