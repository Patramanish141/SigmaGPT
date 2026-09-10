import express from 'express';
import Thread  from '../models/Thread.js';
import getOpenAIAPIResponse from "../utils/openai.js"
import { requireAuth } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

//test
router.post("/test", async(req, res)=>{
    try{
        const thread = new Thread({
            threadId:"xyz",
            title:"testing new Thread"
        })

        const response = await thread.save();
        res.send(response);
    } catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to save in DB"})
    }
})

//Get all routes
router.get("/thread", requireAuth, async(req, res)=>{
    try{
        const threads = await Thread.find({}).sort({updatedAt: -1});
        res.json(threads);

    } catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
})

router.get("/thread/:threadId", requireAuth, async(req, res)=>{
    const {threadId} = req.params;
    try{
        const thread = await Thread.findOne({ threadId });

        if(!thread){
            return res.status(400).json({error: "Thread not found"});
        }

        res.json(thread.messages);
    }catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", requireAuth, async(req, res)=>{
    const {threadId} = req.params;

    try{
        const deletedThread = await Thread.findOneAndDelete({threadId});

        if(!deletedThread){
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({success: "Thread deleted successfully"});
    } catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
})

router.post("/chat", requireAuth, async(req, res)=>{
    const {threadId, message} = req.body;

    if(!threadId || !message){
        return res.status(404).json({error: "Missing required fields"})
    }
    try{
        let thread = await Thread.findOne({threadId});

        if(!thread){
            //Create a new thread in Db
            thread = new Thread({
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