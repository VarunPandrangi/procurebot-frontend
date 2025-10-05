import React, { useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./BuyerDashboard.css";

// 👇 Use env variable for backend API
const API_URL = process.env.REACT_APP_API_URL; // e.g. https://procurebot-backend.onrender.com

const CHECK_ENDPOINT = `${API_URL}/api/negotiations/code-exists/`;
const BY_BUYER_ENDPOINT = `${API_URL}/api/negotiations/by-buyer`;

const icons = {
  total: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  active: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  concluded: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  suppliers: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
};

export default function BuyerDashboard() {
  const [email, setEmail] = useState("");
  const [dashboardCode, setDashboardCode] = useState("");
  const [codeRequired, setCodeRequired] = useState(null);
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");

  const checkEmail = async e => {
    e.preventDefault();
    setNegotiations([]); setCodeRequired(null); setDashboardCode('');
    if (!email.trim()) return;
    try {
      const result = await axios.get(CHECK_ENDPOINT + encodeURIComponent(email.trim()));
      setCodeRequired(result.data.exists);
    } catch {
      setCodeRequired(null); alert("Could not check account, try again.");
    }
  };

  const fetchNegotiations = async e => {
    e.preventDefault();
    setLoading(true); setNegotiations([]);
    try {
      const res = await axios.post(BY_BUYER_ENDPOINT, {
        email: email.trim(), dashboard_code: dashboardCode.trim()
      });
      setNegotiations(res.data || []);
    } catch { alert("Failed to load negotiations! (Wrong code or email?)"); }
    setLoading(false);
  };

  const deleteNegotiation = async (id, name) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/negotiations/${id}`, {
        data: {
          email: email.trim(),
          dashboard_code: dashboardCode.trim()
        }
      });
      
      // Remove from local state
      setNegotiations(prev => prev.filter(n => n.id !== id));
      alert("Negotiation deleted successfully!");
    } catch (err) {
      alert("Failed to delete negotiation. Please try again.");
    }
  };

  const filtered = useMemo(() => {
    let list = negotiations;
    if (tab === "active") list = list.filter(n => n.status !== "concluded");
    if (tab === "concluded") list = list.filter(n => n.status === "concluded");
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(n =>
        n.name?.toLowerCase().includes(s) ||
        n.status?.toLowerCase().includes(s) ||
        ((n.target_details && JSON.parse(typeof n.target_details === "string" ? n.target_details : JSON.stringify(n.target_details)).supplierName || "").toLowerCase().includes(s))
      );
    }
    return list;
  }, [negotiations, tab, search]);

  const total = negotiations.length;
  const active = negotiations.filter(n => n.status !== "concluded").length;
  const concluded = negotiations.filter(n => n.status === "concluded").length;
  const suppliers = useMemo(() => {
    const supplierSet = new Set();
    for (let n of negotiations) {
      let td = n.target_details;
      if (typeof td === "string") { try { td = JSON.parse(td); } catch {} }
      if (td && td.supplierName && td.supplierName.trim()) supplierSet.add(td.supplierName.trim());
    }
    return supplierSet.size;
  }, [negotiations]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Buyer Dashboard</h1>
          <p className="dashboard-subtitle">Manage and monitor your supplier negotiations</p>
        </div>

        {/* Stat cards */}
        <div className="stats-grid">
          <StatCard label="Total Negotiations" value={total} icon={icons.total} />
          <StatCard label="Active" value={active} icon={icons.active} />
          <StatCard label="Concluded" value={concluded} icon={icons.concluded} green />
          <StatCard label="Suppliers" value={suppliers} icon={icons.suppliers} />
        </div>

        {/* Login/Filters */}
        <div className="filter-card">
          <form onSubmit={fetchNegotiations} className="filter-form">
            <div className="filter-group">
              <label className="filter-label">Email</label>
              <input
                className="filter-input"
                placeholder="Email"
                value={email}
                onChange={e => {setEmail(e.target.value); setCodeRequired(null); setDashboardCode(""); setNegotiations([]);}}
                required
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Access Code</label>
              <input
                className="filter-input"
                placeholder="Access Code"
                value={dashboardCode}
                onChange={e => setDashboardCode(e.target.value)}
                type="password"
                minLength={3}
                maxLength={20}
                required
              />
            </div>
            <button
              type="submit"
              className="filter-submit-btn"
              disabled={loading || !dashboardCode || !email}
            >
              Continue
            </button>
          </form>
          <input
            type="text"
            className="search-input"
            placeholder="Search negotiations by name, supplier, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="tabs-row">
          <button onClick={() => setTab("active")} className={`tab-button ${tab==="active" ? "active" : ""}`}>
            Active Negotiations ({active})
          </button>
          <button onClick={() => setTab("concluded")} className={`tab-button ${tab==="concluded" ? "active" : ""}`}>
            Concluded ({concluded})
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="negotiations-table">
            <colgroup>
              <col style={{width: '22%'}}/>
              <col style={{width: '10%'}}/>
              <col style={{width: '18%'}}/>
              <col style={{width: '16%'}}/>
              <col style={{width: '16%'}}/>
              <col style={{width: '18%'}}/>
            </colgroup>
            <thead className="table-head">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Status</th>
                <th className="table-th">Supplier</th>
                <th className="table-th">Created</th>
                <th className="table-th">Updated</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="table-td" style={{textAlign:"center", padding:"34px 0"}}>
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                      </svg>
                      <h3>No negotiations found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(n => {
                let td = n.target_details;
                if (typeof td === "string") { try { td = JSON.parse(td); } catch {} }
                return (
                  <tr key={n.id} className="table-row-hover">
                    <td className="table-td name-col" title={n.name} data-label="Name">{n.name}</td>
                    <td className="table-td" data-label="Status">
                      <span className={`status-pill ${n.status}`}>
                        {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-td supplier-col" title={td?.supplierName || ""} data-label="Supplier">{td?.supplierName || ""}</td>
                    <td className="table-td" data-label="Created">{new Date(n.created_at).toLocaleString()}</td>
                    <td className="table-td" data-label="Updated">{new Date(n.updated_at).toLocaleString()}</td>
                    <td className="table-td" data-label="Actions">
                      <div className="action-buttons">
                        <Link to={`/negotiation/${n.id}`}>
                          <button className="open-btn" title="Open negotiation">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Open
                          </button>
                        </Link>
                        <a href={`${API_URL}/api/negotiations/${n.id}/export-pdf`} target="_blank" rel="noopener noreferrer">
                          <button className="pdf-btn" title="Download PDF">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            PDF
                          </button>
                        </a>
                        <button 
                          className="delete-btn" 
                          onClick={() => deleteNegotiation(n.id, n.name)}
                          title="Delete negotiation"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, green }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${green ? 'concluded' : ''}`}>{value}</div>
    </div>
  );
}
