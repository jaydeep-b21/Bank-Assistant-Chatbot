import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",  // Django backend
  withCredentials: true                   // so session cookie is saved
});

export default api;
