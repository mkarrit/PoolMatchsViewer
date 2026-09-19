import React, { memo } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import TvPage from "./pages/TvPage";
import AdminPage from "./pages/AdminPage";
import { ToastContainer } from "./components/Toast";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { useToast } from "./hooks/useToast";
import { useTheme } from "./hooks/useTheme";

const linkClass = ({ isActive }) =>
  `flex items-center gap-1 transition-colors duration-200 text-sm ${
    isActive ? "text-accent font-semibold" : "text-text-primary hover:text-accent"
  }`;

const Navigation = memo(function Navigation() {
  return (
    <nav className="bg-glass-medium backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center gap-4">
          {/* `end` : sans lui, "/" resterait actif sur toutes les routes. */}
          <NavLink to="/" end className={linkClass}>
            📺 TV
          </NavLink>
          <div className="w-px h-4 bg-white/10"></div>
          <NavLink to="/admin" className={linkClass}>
            ⚙️ Admin
          </NavLink>
        </div>
      </div>
    </nav>
  );
});

const NotFound = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
    <div className="text-5xl opacity-50">🎱</div>
    <p className="text-xl font-bold text-text-primary">Page introuvable</p>
    <NavLink to="/" className="text-accent hover:underline">
      Retour à l'écran TV
    </NavLink>
  </div>
);

export default function App() {
  const { toasts, addToast, removeToast } = useToast();

  // Applique le thème enregistré aux variables CSS de la page.
  useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-primary to-secondary">
      <Navigation />

      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<TvPage />} />
          <Route path="/admin" element={<AdminPage addToast={addToast} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Footer />
    </div>
  );
}
