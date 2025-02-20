import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    companyCode:{
        type: String,
        required: function(){
            return this.role === 'client';
        }
    },
    role:{
        type: String,
        required: true,
        enum: ['admin', 'employee', 'client']
    },
    position:{
        type: String,
        required: function(){
            return this.role === 'employee';
        }
    },
    location:{
        type: String,
        required: function(){
            return this.role === 'client';
        }
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: function(){
            return this.role !== "admin";
        }
    }
},{
    timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;