import React, { useState } from "react";
import api from "../api";

export default function Signup() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("register/", form);
      setStatus("Registered! Now you can login.");
    } catch (err) {
      setStatus("Error registering.");
    }
  };

  return (
  <div className="auth-card">
    <h2>Create Account</h2>
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
      <button type="submit">Signup</button>
    </form>
    <p className="status">{status}</p>
    <p>
      Already registered? <a href="/login">Login</a>
    </p>
  </div>
);
}
