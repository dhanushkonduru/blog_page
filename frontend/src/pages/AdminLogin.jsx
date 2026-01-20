import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Loader from "../components/Loader.jsx";
import Input from "../components/Input.jsx";
import { isTokenValid, setToken } from "../utils/auth.js";


export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  if (isTokenValid()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      setToken(res.data.token);
      navigate("/admin");
    } catch (err) {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] bg-white">

    {/* LEFT: Illustration */}
    <div className="hidden md:flex items-center justify-center bg-gray-50">
      <img
        src="/login-illustration.png"
        alt="Admin login illustration"
        className="w-full max-w-[520px] object-contain"
      />
    </div>

    {/* DIVIDER */}
    <div className="hidden md:block bg-gray-200 w-px" />

    {/* RIGHT: Login */}
    <div className="flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Title */}
        <div className="mb-8">
          <div className="h-1 w-10 bg-purple-500 rounded-full mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">
            Blog Admin & Author&apos;s Login
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div className="relative">
            <input
              type="text"
              placeholder="johndoe@xyz.com"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError("");
              }}
              className="
                w-full h-12 rounded-full
                border border-gray-200
                px-5 pr-12 text-sm
                focus:outline-none focus:border-purple-400
              "
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              👤
            </span>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="
                w-full h-12 rounded-full
                border border-gray-200
                px-5 pr-12 text-sm
                focus:outline-none focus:border-purple-400
              "
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="
                absolute right-4 top-1/2 -translate-y-1/2
                text-gray-400 hover:text-gray-600
              "
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="
              flex items-center gap-2
              rounded-full
              border border-red-200
              bg-red-50
              px-4 py-2
              text-sm text-red-700
            ">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full h-12 rounded-full
              bg-purple-500 text-white
              font-medium tracking-wide
              hover:bg-purple-600
              transition disabled:opacity-60
            "
          >
            {loading ? "Signing in..." : "LOGIN"}
          </button>

          {/* Footer */}
          <p className="pt-8 text-center text-xs text-gray-400">
            Terms of use · Privacy policy
          </p>

        </form>
      </div>
    </div>
  </div>
);


}
