import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { Mycontext } from './MyContext.jsx';
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {ScaleLoader} from 'react-spinners';

function ChatWindow(){
    const {reply, setReply, prompt, setPrompt, currThreadId, prevChats, setPrevChats, setNewChat, username, setUsername, getAllThreads} = useContext(Mycontext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const getReply = async()=>{
        setLoading(true);
        setNewChat(false);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId,
            })
        };

        try {
            const response = await fetch("http://localhost:8080/api/chat", options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply)
        } catch(err){
            console.log(err);
        }
        setLoading(false);
    };

    //Append new chats to prevChats
    useEffect(() => {
        if(prompt && reply){
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: 'user',
                    content: prompt
                },{
                    role:'assistant',
                    content: reply
                }]
            ));
            getAllThreads();
        }

        setPrompt("");
    }, [reply])

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsername(null);
        navigate("/login");
    };

    return(
        <div className="chatWindow">
            <div className="navbar">
                <span>SigmaGPT</span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                    {username && <span className="userName">{username}</span>}
                </div>
            </div>
            {
                isOpen &&
                <div className="dropDown">
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i>Upgrade Plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i>Settings</div>
                    <div className="dropDownItem" onClick={handleLogout}><i className="fa-solid fa-arrow-right-from-bracket"></i>Logout</div>
                </div>
            }
            <Chat/>

            <ScaleLoader color="#fff" loading={loading}/>

            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder="Ask anything" 
                        value={prompt}
                        onChange={(e) => {setPrompt(e.target.value)}}
                        onKeyDown = {(e) => e.key === "Enter" ? getReply() : ""}
                    >
                        
                    </input>
                    <div className="submit" onClick={getReply}>
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>
                </div>
                <p className="info">
                    SigmaGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;