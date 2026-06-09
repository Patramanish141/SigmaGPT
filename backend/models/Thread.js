import mongoose from "mongoose";
import { threadId } from "node:worker_threads";

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        require: true,
    }, 
    content: {
        type: String,
        required : true,
    },
    timestamp: {
        type: Date,
        default: Date.now(),
    }
});

const ThreadSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        default: "New Chat",
    },
    messages: [MessageSchema],
    createdAt:{
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now(),
    }
})

export default mongoose.model("Thread", ThreadSchema);