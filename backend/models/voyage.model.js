import mongoose from "mongoose";

const voyageSchema = mongoose.Schema({
    voyageName: {
        type: String,
        required: true
    },
    voyageNumber:{
        type: String,
        required: true,
        unique: true
    },
    year:{
        type: Number,
        required: true
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status:{
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    },
    lastPrintedCounts: { 
        type: Map, 
        of: Number, 
        default: {} 
    },
    uploadedData:[{
        productCode:{
            type: String,
            required: true
        },
        trackingNumber:{
            type: String,
            required: true
        },
        clientCompany:{
            type: String,
            required: true
        },
        uploadedBy:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        image:{
            type: String,
            required: true
        },
        status:{ 
            type: String, 
            enum: ["pending", "completed"], default: "pending" 
        },
        uploadedDate:{
            type: Date,
            default: Date.now
        }
    }]
},{
    timestamps: true
})

const Voyage = mongoose.model("Voyage", voyageSchema);

export default Voyage;