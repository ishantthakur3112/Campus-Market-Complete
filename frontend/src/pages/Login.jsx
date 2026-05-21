import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// IMPORT YOUR CUSTOM AXIOS INSTANCE
import api from "../config/api"; 

import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const redirectWithDelay = (path, delay = 800) => {
    setTimeout(() => navigate(path, { replace: true }), delay);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const loginPromise = async () => {
        // CHANGED: Use your unified api instance. 
        // It reads from your config, automatically sets up JSON headers, and hooks into the spinner context.
        const res = await api.post("/api/auth/login", formData);
        
        // Axios stores the backend's json response body inside the .data object
        const data = res.data;

        login(data.user, data.token);
        return data;
      };

      await toast.promise(loginPromise(), {
        loading: "Logging you in...",
        success: "Login successful!",
        // Axios errors store the server's response object inside error.response
        error: (err) => err.response?.data?.message || "Login failed",
      });

      redirectWithDelay(from);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="auth-tag">Welcome back</p>
        <h1>Login to CampusMarket</h1>
        <p className="auth-subtext">
          Access your account to browse listings, manage uploads, and continue
          your campus marketplace activity.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;