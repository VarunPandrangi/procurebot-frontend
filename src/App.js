import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import BuyerForm from "./pages/BuyerForm";
import NegotiationChat from "./pages/NegotiationChat";
import BuyerDashboard from "./pages/BuyerDashboard";
import NegotiationWizard from "./pages/NegotiationWizard";
import InteractiveBackground from "./components/InteractiveBackground";
import ThemeToggle from "./components/ThemeToggle";
import "./theme.css";

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="app-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <img 
            src="/thermopads-logo.webp" 
            alt="Thermopads Logo" 
            className="nav-logo"
          />
          <span className="nav-brand-text">Thermo Bot</span>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l9 4.9V17L12 22l-9-4.9V7z" />
            </svg>
            <span>New Negotiation</span>
          </Link>
          
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </Link>
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <InteractiveBackground />
        <Navigation />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<NegotiationWizard />} />
            <Route path="/negotiation/:negotiationId" element={<NegotiationChat />} />
            <Route path="/dashboard" element={<BuyerDashboard />} />
            <Route path="/wizard" element={<NegotiationWizard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
