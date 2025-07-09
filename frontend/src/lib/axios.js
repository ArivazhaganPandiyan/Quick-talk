import axios from "axios";



export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "https://quick-talk-1zfh.onrender.com/api" 
    : "/api",
  withCredentials: true,
});

// Add request interceptor to include token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
