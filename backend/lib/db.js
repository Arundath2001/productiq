import mongoose from "mongoose"

export const connectDb = async () =>{
    try {
        const conn = mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.log(`Error : ${error.message}`);
        exit(1);
    }
}