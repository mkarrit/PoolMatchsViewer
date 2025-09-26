import React, { memo, useMemo } from "react";
import { Routes, Route, Link } from "react-router-dom";
import TvPage from "./pages/TvPage";
import AdminPage from "./pages/AdminPage";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";

// Mémoriser la navigation pour éviter les re-renders
const Navigation = memo(() => (
  <nav className="bg-glass-medium backdrop-blur-xl border-b border-white/10 shadow-lg">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex items-center gap-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors duration-300 font-semibold"
        >
          📺 Mode TV
        </Link>
        <div className="w-px h-6 bg-white/20"></div>
        <Link 
          to="/admin" 
          className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors duration-300 font-semibold"
        >
          ⚙️ Mode Admin
        </Link>
      </div>
    </div>
  </nav>
));

export default function App() {
  const { toasts, addToast, removeToast } = useToast();

  // Mémoriser l'élément AdminPage pour éviter les re-créations
  const adminPageElement = useMemo(() => (
    <AdminPage addToast={addToast} />
  ), [addToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-primary to-secondary">
      <Navigation />

      <Routes>
        <Route path="/" element={<TvPage />} />
        <Route path="/admin" element={adminPageElement} />
      </Routes>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
