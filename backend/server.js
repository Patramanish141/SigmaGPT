import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dns from "dns";
import chatRoutes from "./routes/chat.js";
import authRoute from "./routes/AuthRoute.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 8080;

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/api", chatRoutes);
app.use("/", authRoute);

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

