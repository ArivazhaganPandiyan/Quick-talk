import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://quick-talk-1zfh.onrender.com/api" : "/api",
  withCredentials: true,
});
