const mongoose = require("mongoose");

const connectDB = async()=>{
    try{
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing. Add it in Render Environment variables.");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    }
    catch(error){
        console.error("MongoDB Connection Error:", error);
        process.exit(1);
    }
}

module.exports = connectDB;