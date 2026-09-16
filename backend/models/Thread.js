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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    threadId: {
        type: String,
        required: true,
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

ThreadSchema.index({ userId: 1, threadId: 1 }, { unique: true });

export default mongoose.model("Thread", ThreadSchema);