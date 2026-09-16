import express from 'express';
import Thread  from '../models/Thread.js';
import getOpenAIAPIResponse from "../utils/openai.js"
import { requireAuth } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Fail closed: without an id every query below would be unscoped, and Mongoose
// strips undefined from filters, so find({userId: undefined}) returns everything.
const requireUserId = (req, res, next) => {
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

router.use(requireAuth, requireUserId);

//Get all routes
router.get("/thread", async(req, res)=>{
    try{
        const threads = await Thread.find({userId: req.userId}).sort({updatedAt: -1});
        res.json(threads);

    } catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
})

router.get("/thread/:threadId", async(req, res)=>{
    const {threadId} = req.params;
    try{
        const thread = await Thread.findOne({ threadId, userId: req.userId });

        if(!thread){
            return res.status(404).json({error: "Thread not found"});
        }

        res.json(thread.messages);
    }catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async(req, res)=>{
    const {threadId} = req.params;

    try{
        const deletedThread = await Thread.findOneAndDelete({threadId, userId: req.userId});

        if(!deletedThread){
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({success: "Thread deleted successfully"});
    } catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
})

router.post("/chat", async(req, res)=>{
    const {threadId, message} = req.body;

    if(!threadId || !message){
        return res.status(404).json({error: "Missing required fields"})
    }
    try{
        let thread = await Thread.findOne({threadId, userId: req.userId});

        if(!thread){
            //Create a new thread in Db
            thread = new Thread({
                userId: req.userId,
                threadId,
                title: message,
                messages :[{
                    role: "user",
                    content: message
                }]
            })
        } else{
            thread.messages.push({role:"user", content: message});
        }
        const assistantReply = await getOpenAIAPIResponse(message);
        thread.messages.push({role: "assistant", content: assistantReply});
        thread.updatedAt = new Date();

        await thread.save();
        res.json({reply: assistantReply});
    } catch(err){
        console.log(err);
        res.status(500).json({error: "Something went wrong"});
    }
})

export default router;
