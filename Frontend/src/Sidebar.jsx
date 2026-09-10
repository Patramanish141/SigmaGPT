import "./Sidebar.css"
import { useContext, useEffect } from "react";
import {Mycontext} from "./MyContext.jsx";
import {v1 as uuidv1} from "uuid";

function Sidebar(){
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, getAllThreads} = useContext(Mycontext);

    useEffect(() => {
        getAllThreads();
    }, []);

    const createNewChat = () =>{
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    const changeThread = async(newThreadId) =>{
        setCurrThreadId(newThreadId);

        try{
            const response = await fetch(`http://ec2-16-171-18-152.eu-north-1.compute.amazonaws.com:8080/api/thread/${newThreadId}`, { credentials: "include" });
            const res = await response.json();
            console.log(res);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch(err){
            console.log(err);
        }
    }

    const deleteThread = async(threadId) => {
        try{
            const response = await fetch(`http://ec2-16-171-18-152.eu-north-1.compute.amazonaws.com:8080/api/thread/${threadId}`, {method: "DELETE", credentials: "include"});
            const res = await response.json();
            console.log(res);  
            
            //updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if(threadId === currThreadId){
                createNewChat();
            }
        } catch(err){
            console.log(err);
        }

    }

    return(
        <section className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <img src="src/assets/blacklogo.png" alt="SigmaGPT logo" className="logo"></img>
                    <span className="brand-name">SigmaGPT</span>
                </div>
            </div>

            <button className="new-chat-btn" onClick={createNewChat}>
                <i className="fa-solid fa-pen-to-square"></i>
                <span>New chat</span>
            </button>

            {allThreads?.length > 0 && <div className="section-label">Recent</div>}

            <ul className="history">
                {
                    allThreads?.length > 0 ? allThreads.map((thread, idx) => (
                        <li key={idx}
                            onClick={() => changeThread(thread.threadId)}
                            className={thread.threadId === currThreadId ? "highlighted" : ""}
                        >
                            <span className="thread-title">{thread.title}</span>
                            <i className="fa-solid fa-trash"
                                onClick={(e)=>{
                                    e.stopPropagation();//stop event bubbling
                                    deleteThread(thread.threadId);
                                }}
                            ></i>
                        </li>
                    )) : (
                        <li className="history-empty" style={{cursor: "default"}}>No conversations yet</li>
                    )
                }
            </ul>

            <div className="sign">
                <p>By Manish Patra &hearts;</p>
            </div>
        </section>
    )
}

export default Sidebar;