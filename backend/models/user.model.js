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
        enum: ['employee', 'client', 'admin']
    },
    adminRoles: {
        type: [String],
        default: [],
        validate: {
            validator: function (roles) {
                const validAdminRoles = ['bl', 'invoice', 'approve', "superadmin", "air_cargo_admin", "ship_cargo_admin"];
                return roles.every(role => validAdminRoles.includes(role));
            },
            message: 'Invalid admin role specified'
        }
    },
    position: {
        type: String,
        required: function () {
            return this.role === 'employee';
        }
    },
    phoneNumber: {
        type: String,
        required: function () {
            return this.role === 'client';
        },
        validate: {
            validator: function (phone) {
                if (this.role === 'client' && phone) {
                    return /^[\+]?[0-9][\d\s]{0,15}$/.test(phone);
                }
                return true;
            },
            message: 'Please enter a valid phone number'
        }
    },
    countryCode: {
        type: String,
        required: function () {
            return this.role === 'client' && this.approvalStatus !== 'rejected';
        }
    },
    email: {
        type: String,
        required: function () {
            return this.role === 'client';
        },
        unique: true,
        sparse: true,
        validate: {
            validator: function (email) {
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
        required: function () {
            return this.role !== "admin" && this.role !== "client";
        }
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: function () {
            return this.role === 'employee' ||
                (this.adminRoles && (
                    this.adminRoles.includes('air_cargo_admin') ||
                    this.adminRoles.includes('ship_cargo_admin')
                ));
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
    approvalStatus: {
        type: String,
        default: function () {
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

userSchema.index({ role: 1 });
userSchema.index({ adminRoles: 1 });
userSchema.index({ approvalStatus: 1 });
userSchema.index({ countryCode: 1 });
userSchema.index({ branchId: 1 });

userSchema.virtual('needsApproval').get(function () {
    return this.role === 'client' && this.approvalStatus === 'pending';
});

userSchema.virtual('isApproved').get(function () {
    return this.approvalStatus === 'approved';
});

userSchema.virtual('isRejected').get(function () {
    return this.approvalStatus === 'rejected';
});

userSchema.methods.hasAdminRole = function (adminRole) {
    return this.adminRoles.includes(adminRole);
};

userSchema.methods.hasAnyAdminRole = function (adminRoles) {
    return adminRoles.some(role => this.adminRoles.includes(role));
};

userSchema.methods.addAdminRole = function (adminRole) {
    if (!this.adminRoles.includes(adminRole)) {
        this.adminRoles.push(adminRole);
    }
};

userSchema.methods.removeAdminRole = function (adminRole) {
    this.adminRoles = this.adminRoles.filter(role => role !== adminRole);
};

userSchema.methods.canAccess = function (feature) {
    const adminRoles = ['superadmin', 'shipadmin', 'airadmin'];

    if (!adminRoles.includes(this.role)) {
        return false;
    }

    if (this.role === 'superadmin') {
        return true;
    }

    return this.adminRoles.includes(feature);
};

userSchema.methods.belongsToBranch = function (branchId) {
    return this.branchId && this.branchId.toString() === branchId.toString();
};

const User = mongoose.model("User", userSchema);

export default User;