import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" 
  ? "https://quick-talk-1zfh.onrender.com" 
  : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check", {
        withCredentials: true
      });
      
      if (res.data) {
        set({ authUser: res.data });
        localStorage.setItem('token', res.data.token);
        get().connectSocket();
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      localStorage.removeItem('token');
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data, {
        withCredentials: true
      });
      set({ authUser: res.data });
      localStorage.setItem('token', res.data.token);
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data, {
        withCredentials: true
      });
      set({ authUser: res.data });
      localStorage.setItem('token', res.data.token);
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout", {}, {
        withCredentials: true
      });
      set({ authUser: null });
      localStorage.removeItem('token');
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data, {
        withCredentials: true
      });
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
  const { authUser } = get();
  const token = localStorage.getItem('token');
  
  if (!authUser || !token || get().socket?.connected) return;

  const socket = io(BASE_URL, {
    auth: {
      token: token
    },
    withCredentials: true,
    reconnectionAttempts: 5,  // Increased from 3 to 5
    reconnectionDelay: 1500,  // Slightly longer delay
    autoConnect: true,
    transports: ["websocket"]  // Force WebSocket transport only
  });

  // Add connection success handler
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
    if (err.message.includes("401") || err.message.includes("403")) {
      get().logout();
      toast.error("Session expired. Please login again.");
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      get().logout();
    }
  });

  // More robust online users handler
  socket.on("getOnlineUsers", (userIds) => {
    if (Array.isArray(userIds)) {
      set({ onlineUsers: userIds });
    }
  });

  // Ping/pong handler for connection health
  socket.on("ping", (cb) => {
    if (typeof cb === "function") cb();
  });

  set({ socket });
},

disconnectSocket: () => {
  const socket = get().socket;
  if (socket) {
    // Remove all listeners to prevent memory leaks
    socket.off("connect");
    socket.off("connect_error");
    socket.off("disconnect");
    socket.off("getOnlineUsers");
    socket.off("ping");
    
    if (socket.connected) {
      socket.disconnect();
    }
  }
  set({ socket: null });
},
}));