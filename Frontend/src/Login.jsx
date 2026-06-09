import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { Mycontext } from "./MyContext.jsx";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { setUsername } = useContext(Mycontext);
  const [inputValue, setInputValue] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { email, password } = inputValue;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({ ...inputValue, [name]: value });
  };

  const handleError = (err) => toast.error(err, { position: "bottom-left" });
  const handleSuccess = (msg) => toast.success(msg, { position: "bottom-left" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:8080/login",
        { ...inputValue },
        { withCredentials: true }
      );
      const { success, message } = data;
      if (success) {
        setUsername(data.user);
        handleSuccess(message);
        setTimeout(() => navigate("/"), 1000);
      } else {
        handleError(message);
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
    setInputValue({ email: "", password: "" });
  };

  return (
    <div className="auth-root">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="auth-card">
        <div className="auth-logo">
          <svg className="logo-svg" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M37.5 20.5C37.5 29.9 29.9 37.5 20.5 37.5C11.1 37.5 3.5 29.9 3.5 20.5C3.5 11.1 11.1 3.5 20.5 3.5C29.9 3.5 37.5 11.1 37.5 20.5Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M20.5 14.5C23.8 14.5 26.5 17.2 26.5 20.5C26.5 23.8 23.8 26.5 20.5 26.5C17.2 26.5 14.5 23.8 14.5 20.5C14.5 17.2 17.2 14.5 20.5 14.5Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your SigmaGPT account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              name="email"
              value={email}
              placeholder="you@example.com"
              onChange={handleOnChange}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="password-wrapper">
              <input
                className="field-input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                placeholder="Enter your password"
                onChange={handleOnChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="switch-link">Sign up</Link>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;
