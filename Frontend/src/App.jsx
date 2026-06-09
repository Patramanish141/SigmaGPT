import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { Mycontext } from './MyContext.jsx';
import { useState, useEffect } from 'react';
import {v1 as uuidv1} from "uuid";
import {Route, Routes, Navigate} from 'react-router-dom';
import Login from './Login.jsx';
import SignUp from './Signup.jsx';
import axios from 'axios';

function App() {
  const [prompt ,setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [username, setUsername] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    axios.post("http://localhost:8080/", {}, { withCredentials: true })
      .then(({ data }) => {
        if (data.status) setUsername(data.user);
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, []);

  const providerValues = {
    reply, setReply,
    prompt, setPrompt,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    username, setUsername,
  };

  if (authLoading) {
    return <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>;
  }

  return (
    <div className='app'>
      <Mycontext.Provider value={providerValues}>
        <Routes>

          <Route path="/login" element={username ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/signup" element={username ? <Navigate to="/" replace /> : <SignUp />} />

          <Route
            path="/"
            element={
              username ? (
                <>
                  <Sidebar />
                  <ChatWindow />
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

        </Routes>
      </Mycontext.Provider>
    </div>
  )
}

export default App;
