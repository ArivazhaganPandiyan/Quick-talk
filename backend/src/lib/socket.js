import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://quick-talk-1zfh.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

// Store online users
const userSocketMap = {};

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    
    socket.userId = decoded.userId;
    next();
  });
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.userId})`);

  if (socket.userId) {
    userSocketMap[socket.userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.id} (Reason: ${reason})`);
    
    if (socket.userId && userSocketMap[socket.userId]) {
      delete userSocketMap[socket.userId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Export only what's needed
export { io, server, app };