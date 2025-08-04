import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function UsersList({ user }) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.post("list_users/");
        setUsers(res.data.users);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="users-list-container">
      <div className="users-header">
        <h2>📂 Users & Uploaded PDFs</h2>
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ⬅ Back to Dashboard
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>S. No.</th>
            <th>Full Name</th>
            <th>PDFs</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.s_no}>
              <td>{u.s_no}</td>
              <td>{u.full_name}</td>
              <td>
                {u.pdfs.length > 0
                  ? u.pdfs.map((pdf, i) => (
                      <span key={i}>
                        {pdf}
                        {i < u.pdfs.length - 1 ? ", " : ""}
                      </span>
                    ))
                  : "No PDFs"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
