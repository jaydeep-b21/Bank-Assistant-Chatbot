import React, { useState } from "react";
import { useNavigate } from "react-router-dom";   // ✅ import
import api from "../api";

export default function Login({ setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();   // ✅ hook

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("login/", form);
      setUser({
        username: form.username,
        isAdmin: res.data.is_admin,
      });
      navigate("/dashboard");   // ✅ redirect after login
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
  <div className="auth-card">
    <h2>Bank Assistant Login</h2>
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Login</button>
    </form>
    {error && <p className="error">{error}</p>}
    <p>
      You don't have an account at BNB Bank? <a href="/signup">Signup</a>
    </p>
  </div>
);
}
