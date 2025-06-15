import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    companyCode: {
        type: String,
        default: null,
        required: false
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'employee', 'client']
    },
    position: {
        type: String,
        required: function() {
            return this.role === 'employee';
        }
    },
    phoneNumber: {
        type: String,
        required: function() {
            return this.role === 'client';
        },
        validate: {
            validator: function(phone) {
                if (this.role === 'client' && phone) {
                    return /^[\+]?[0-9][\d]{0,15}$/.test(phone);
                }
                return true;
            },
            message: 'Please enter a valid phone number'
        }
    },
    email: {
        type: String,
        required: function() {
            return this.role === 'client';
        },
        unique: true,
        sparse: true,
        validate: {
            validator: function(email) {
                if (email) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                }
                return true;
            },
            message: 'Please enter a valid email address'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function() {
            return this.role !== "admin" && this.role !== "client";
        }
    },
    expoPushTokens: [{
        token: {
            type: String,
            required: true
        },
        deviceId: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // New approval system fields
    approvalStatus: {
        type: String,
        default: function() {
            return this.role === 'client' ? 'pending' : 'approved';
        },
        enum: ['pending', 'approved', 'rejected']
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    rejectionMessage: {
        type: String,
        default: null,
        maxlength: 500
    },
    approvalNotes: {
        type: String,
        default: null,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Add indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ approvalStatus: 1 });
userSchema.index({ companyCode: 1 });

// Virtual to check if user needs approval
userSchema.virtual('needsApproval').get(function() {
    return this.role === 'client' && this.approvalStatus === 'pending';
});

// Virtual to check if user is approved
userSchema.virtual('isApproved').get(function() {
    return this.approvalStatus === 'approved';
});

// Virtual to check if user is rejected
userSchema.virtual('isRejected').get(function() {
    return this.approvalStatus === 'rejected';
});

const User = mongoose.model("User", userSchema);

export default User;