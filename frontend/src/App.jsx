import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { 
    authUser, 
    checkAuth, 
    isCheckingAuth, 
    onlineUsers,
    connectSocket,
    disconnectSocket
  } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const checkAuthAndConnect = async () => {
      try {
        await checkAuth();
        if (authUser) {
          connectSocket();
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      }
    };

    checkAuthAndConnect();

    return () => {
      if (authUser) {
        disconnectSocket();
      }
    };
  }, [checkAuth, connectSocket, disconnectSocket, authUser]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />
      
      <Routes>
        <Route 
          path="/" 
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/signup" 
          element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/login" 
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/settings" 
          element={authUser ? <SettingsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />} 
        />
      </Routes>

      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333',
          },
        }}
      />
    </div>
  );
};

export default App;
