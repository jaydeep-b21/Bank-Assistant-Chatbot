import React, { useState } from "react";
import api from "../api";

export default function Dashboard({ user, setUser }) {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [targetUserId, setTargetUserId] = useState("");  // for admin selection
  const [queryMode, setQueryMode] = useState("all"); // "all" or "specific" for admin

  const askQuestion = async () => {
    if (!question.trim()) return;
    const q = question;
    setChat([...chat, { role: "user", text: q }]);
    setQuestion("");

    try {
      const payload = { question: q };
      
      // For admin users, handle query mode
      if (user.isAdmin) {
        if (queryMode === "specific" && targetUserId) {
          payload.user_id = targetUserId;
        }
        // If queryMode is "all" or no targetUserId, query all users (default for admin)
      }

      const res = await api.post("query/", payload);
      setChat((prev) => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch (err) {
      setChat((prev) => [...prev, { role: "assistant", text: "Error querying" }]);
    }
  };

  const uploadPDF = async () => {
    if (!pdfFile) return;
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    if (user.isAdmin) {
      if (!targetUserId) {
        alert("Please enter a user ID");
        return;
      }
      formData.append("user_id", targetUserId);
    }

    try {
      await api.post("upload_pdf/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("PDF uploaded successfully!");
      setPdfFile(null);
    } catch (err) {
      alert("Error uploading PDF");
    }
  };

  const logout = async () => {
    await api.post("logout/");
    setUser(null);
    localStorage.removeItem("user");   //  clear storage
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome, {user.username}</h2>
        <div className="top-buttons">
          {user.isAdmin && (
            <button
              className="view-users-btn"
              onClick={() => (window.location.href = "/users")}
            >
              View All Users
            </button>
          )}
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {user.isAdmin && (
        <div className="admin-upload">
          <h3>Upload PDF (Admin)</h3>
          <input
            type="text"
            placeholder="Target User ID"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
          />
          <input 
            type="file" 
            onChange={(e) => setPdfFile(e.target.files[0])} 
            accept=".pdf"
          />
          <button className="upload-btn" onClick={uploadPDF}>Upload</button>
        </div>
      )}

      {user.isAdmin && (
        <div className="admin-query-mode">
          <h3>Query Mode (Admin)</h3>
          <div className="query-mode-options">
            <label>
              <input
                type="radio"
                name="queryMode"
                value="all"
                checked={queryMode === "all"}
                onChange={(e) => setQueryMode(e.target.value)}
              />
              Query all users' documents
            </label>
            <label>
              <input
                type="radio"
                name="queryMode"
                value="specific"
                checked={queryMode === "specific"}
                onChange={(e) => setQueryMode(e.target.value)}
              />
              Query specific user
            </label>
          </div>
          {queryMode === "specific" && (
            <input
              type="text"
              placeholder="User ID to query"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              style={{ marginTop: "10px" }}
            />
          )}
        </div>
      )}

      <div className="chat-container">
        <h3>Chat Here</h3>
        {user.isAdmin && (
          <p className="query-info">
            {queryMode === "all" 
              ? "Querying across all users' documents" 
              : queryMode === "specific" && targetUserId 
                ? `Querying user ID: ${targetUserId}` 
                : "Select query mode above"}
          </p>
        )}
        
        <div className="chat-messages">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.role === "user" ? "user" : "assistant"}`}
            >
              <b>{msg.role === "user" ? user.username : "Assistant"}:</b> {msg.text}
            </div>
          ))}
        </div>

        <form
          className="chat-input-area"
          onSubmit={(e) => {
            e.preventDefault();
            askQuestion();
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
          />
          <button type="submit" className="send-btn">Send</button>
        </form>
      </div>
    </div>
  );
}