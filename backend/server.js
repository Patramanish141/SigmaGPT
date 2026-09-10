import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import dns from "dns";
import app from "./app.js";

const PORT = 8080;

dns.setServers(["1.1.1.1", "8.8.8.8"]);

app.listen(PORT, ()=>{
    console.log(`server running on ${PORT}`);
    connectDB();
})

const connectDB = async() => {
    try{

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
    } catch(err){
        console.log("Failed to connect with DB",err)
    }
}
