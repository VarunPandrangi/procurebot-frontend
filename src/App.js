import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import BuyerForm from "./pages/BuyerForm";
import NegotiationChat from "./pages/NegotiationChat";
import BuyerDashboard from "./pages/BuyerDashboard";
import NegotiationWizard from "./pages/NegotiationWizard";

function App() {
  return (
    <BrowserRouter>
      <div style={{padding: "12px 16px", background: "#f8fbfd", marginBottom: 15, display:"flex", alignItems:"center", gap:12}}>
        <Link
          to="/"
          style={{marginRight: 18, fontWeight: "bold", color:"#2255a5", textDecoration:"none"}}
        >
          Start Negotiation
        </Link>
      
        <Link
          to="/dashboard"
          style={{marginRight: 18, fontWeight: "bold", color:"#2255a5", textDecoration:"none"}}
        >
          Dashboard
        </Link>
        
      </div>
      <Routes>
        <Route path="/" element={<NegotiationWizard />} />
        <Route path="/negotiation/:negotiationId" element={<NegotiationChat />} />
        <Route path="/dashboard" element={<BuyerDashboard />} />
        <Route path="/wizard" element={<NegotiationWizard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
