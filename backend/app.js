import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRoutes from "./routes/chat.js";
import authRoute from "./routes/AuthRoute.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "http://ec2-16-171-18-152.eu-north-1.compute.amazonaws.com"],
  credentials: true,
}));

app.use("/api", chatRoutes);
app.use("/", authRoute);

export default app;
