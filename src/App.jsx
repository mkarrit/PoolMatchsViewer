import React, { memo } from "react";
import { Routes, Route, Link } from "react-router-dom";
import TvPage from "./pages/TvPage";
import AdminPage from "./pages/AdminPage";
import { ToastContainer } from "./components/Toast";
import Footer from "./components/Footer";
import { useToast } from "./hooks/useToast";
import { useTheme } from "./hooks/useTheme";

const Navigation = memo(() => (
  <nav className="bg-glass-medium backdrop-blur-xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="flex items-center gap-1 text-text-primary hover:text-accent transition-colors duration-200 text-sm"
        >
          📺 TV
        </Link>
        <div className="w-px h-4 bg-white/10"></div>
        <Link 
          to="/admin" 
          className="flex items-center gap-1 text-text-primary hover:text-accent transition-colors duration-200 text-sm"
        >
          ⚙️ Admin
        </Link>
      </div>
    </div>
  </nav>
));

export default function App() {
  const { toasts, addToast, removeToast } = useToast();
  
  useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-primary to-secondary">
      <Navigation />

      <Routes>
        <Route path="/" element={<TvPage />} />
        <Route path="/admin" element={<AdminPage addToast={addToast} />} />
      </Routes>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Footer />
    </div>
  );
}
