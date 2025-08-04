import React, { useState } from "react";
import api from "../api";

export default function Dashboard({ user, setUser }) {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [targetUserId, setTargetUserId] = useState("");  // for admin selection

  const askQuestion = async () => {
    if (!question.trim()) return;
    const q = question;
    setChat([...chat, { role: "user", text: q }]);
    setQuestion("");

    try {
      const payload = { question: q };
      if (user.isAdmin && targetUserId) {
        payload.user_id = targetUserId;
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
    } catch (err) {
      alert("Error uploading PDF");
    }
  };

  const logout = async () => {
    await api.get("logout/");
    setUser(null);
    localStorage.removeItem("user");   // ✅ clear storage
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
          <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} />
          <button className="upload-btn" onClick={uploadPDF}>Upload</button>
        </div>
      )}

      <div className="chat-container">
        <h3>Chat Here</h3>
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
