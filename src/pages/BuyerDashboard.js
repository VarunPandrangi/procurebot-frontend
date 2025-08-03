import React, { useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// 👇 Use env variable for backend API
const API_URL = process.env.REACT_APP_API_URL; // e.g. https://procurebot-backend.onrender.com

const CHECK_ENDPOINT = `${API_URL}/api/negotiations/code-exists/`;
const BY_BUYER_ENDPOINT = `${API_URL}/api/negotiations/by-buyer`;

const dashStyles = {
  page: { background: "#f4f5fa", minHeight: "100vh" },
  main: { maxWidth: 1120, margin: "46px auto", padding: 32, fontFamily: "Inter,Helvetica,Arial,sans-serif" },
  statRow: { display: "flex", gap: 18, margin: "0 0 27px 0" },
  statCard: {
    flex: 1,
    background: "#fff",
    borderRadius: 16,
    padding: "26px 0 24px 0",
    boxShadow: "0 2px 10px #3b357012",
    display: "flex", flexDirection: "column", alignItems:"center"
  },
  statIcon: { fontSize: 33, marginBottom: 4 },
  statLabel: { marginTop: 4, marginBottom: 2, color: "#888caf", fontWeight: 700, fontSize:17, letterSpacing:0.01 },
  statValue: { fontWeight: 800, fontSize: 27, color: "#19193d"},
  statValueConcluded: { fontWeight: 800, fontSize: 27, color: "#30c874"},
  filterCard: { background: "#fff", borderRadius: 13, boxShadow:"0 1px 8px #dff3ff16", padding: 19, marginBottom: 22, display: "flex", flexDirection: "column", gap:15 },
  filterRow: { display: "flex", alignItems: "flex-end", gap: 22, justifyContent: "flex-start" },
  filterInput: { borderRadius: 8, padding: "11px 15px", border: 0, background: "#f6f7fd", fontSize: 15, width:"100%" },
  filterInputSearch: { borderRadius: 8, padding: "11px 15px", border: 0, background: "#f6f7fd", fontSize: 15, width:"100%", marginTop:5 },
  filterBtn: { padding: "13px 38px", borderRadius: 8, border:0, background: "#6047ed", color:"#fff", fontWeight: 700, fontSize:16, marginLeft:10, cursor:"pointer" },
  tableWrap: { background:"#fff", borderRadius:13, minHeight:100, overflow:"auto" },
  tabRow: { display:"flex", gap:13, margin:"0 0 17px 0" },
  tab: isActive => ({
    fontWeight: isActive ? 800 : 600,
    color: isActive ? "#6047ed" : "#7e8ca6",
    background: isActive ? "#eef3fe" : "#f6f7fb",
    border:"none", borderRadius:9,
    padding:"8px 24px", cursor:"pointer", fontSize:15
  }),
  table: { minWidth: 920, width:"100%", borderCollapse:"separate", borderSpacing: 0, tableLayout: "fixed" },
  thead: { background: "#f9faff" },
  th: { fontWeight: 600, fontSize:14, color:"#7a7c8f", padding: "10px 0", letterSpacing: 0.01 },
  td: { fontSize:15, color:"#211e43", padding: "15px 0", borderBottom:"1px solid #f0f2f8", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis" },
  nameCol: { maxWidth: 260, whiteSpace: "nowrap" },
  supplierCol: { maxWidth: 160, whiteSpace: "nowrap" },
  pdfCol: { width: 80 },
  openCol: { width: 80 },
  statusCell: {width: 97},
  statusPill: status => ({
    display:"inline-block", minWidth:66, padding:"6px 16px",
    borderRadius: 23, fontWeight:700, fontSize:14,
    marginRight:18,
    background: status==="active" ? "#e5f8ef" : "#ffeaea",
    color: status==="active" ? "#16bb76" : "#ed4c57", textTransform: "capitalize"
  }),
  openBtn: { fontWeight:700, color:"#6047ed", background:"#e9e7fd", border:"none", borderRadius:7, padding:"8px 18px", fontSize:14, cursor:"pointer", marginRight:10 },
  pdfBtn: { fontWeight:700, color:"#fff", background:"#ffb6b6", border:"none", borderRadius:7, padding:"8px 18px", fontSize:14, cursor:"pointer" }
};

const icons = {
  total: <span role="img" aria-label="total">📄</span>,
  active: <span role="img" aria-label="active">💬</span>,
  concluded: <span style={{color: "#31c881", fontWeight:700}}>&#10003;</span>,
  suppliers: <span role="img" aria-label="suppliers">👥</span>,
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
    <div style={dashStyles.page}>
      <div style={dashStyles.main}>
        {/* Stat cards */}
        <div style={dashStyles.statRow}>
          <StatCard label="Total Negotiations" value={total} icon={icons.total} color="#6047ed" />
          <StatCard label="Active" value={active} icon={icons.active} color="#6047ed" />
          <StatCard label="Concluded" value={concluded} icon={icons.concluded} color="#37d688" green />
          <StatCard label="Suppliers" value={suppliers} icon={icons.suppliers} color="#ffc928" />
        </div>

        {/* Login/Filters */}
        <div style={dashStyles.filterCard}>
          <form onSubmit={fetchNegotiations} style={dashStyles.filterRow}>
            <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
              <label style={{fontWeight:600, marginBottom:3, fontSize:15}}>Email</label>
              <input
                style={dashStyles.filterInput}
                placeholder="Email"
                value={email}
                onChange={e => {setEmail(e.target.value); setCodeRequired(null); setDashboardCode(""); setNegotiations([]);}}
                required
              />
            </div>
            <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
              <label style={{fontWeight:600, marginBottom:3, fontSize:15}}>Access Code</label>
              <input
                style={dashStyles.filterInput}
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
              style={{
                ...dashStyles.filterBtn,
                background: "#6047ed",
                marginBottom:2
              }}
              disabled={loading || !dashboardCode || !email}
            >
              Continue
            </button>
          </form>
          <input
            type="text"
            style={dashStyles.filterInputSearch}
            placeholder="Search negotiations by name, supplier, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div style={dashStyles.tabRow}>
          <button onClick={() => setTab("active")} style={dashStyles.tab(tab==="active")}>
            Active Negotiations ({active})
          </button>
          <button onClick={() => setTab("concluded")} style={dashStyles.tab(tab==="concluded")}>
            Concluded ({concluded})
          </button>
        </div>

        {/* Table */}
        <div style={dashStyles.tableWrap}>
          <table style={dashStyles.table}>
            <colgroup>
              <col style={{width: '260px'}}/>
              <col style={{width: '100px'}}/>
              <col style={{width: '160px'}}/>
              <col style={{width: '180px'}}/>
              <col style={{width: '180px'}}/>
              <col style={{width: '90px'}}/>
              <col style={{width: '90px'}}/>
            </colgroup>
            <thead style={dashStyles.thead}>
              <tr>
                <th style={dashStyles.th}>Name</th>
                <th style={{...dashStyles.th, width:100}}>Status</th>
                <th style={dashStyles.th}>Supplier</th>
                <th style={dashStyles.th}>Created</th>
                <th style={dashStyles.th}>Updated</th>
                <th style={{...dashStyles.th}}>Open</th>
                <th style={{...dashStyles.th}}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{textAlign:"center", fontSize:17, fontWeight:600, color:"#b7babe", padding:"34px 0"}}>
                    No negotiations found
                  </td>
                </tr>
              )}
              {filtered.map(n => {
                let td = n.target_details;
                if (typeof td === "string") { try { td = JSON.parse(td); } catch {} }
                return (
                  <tr key={n.id}>
                    <td style={{
                      ...dashStyles.td,
                      ...dashStyles.nameCol
                    }} title={n.name}>{n.name}</td>
                    <td style={{...dashStyles.td, ...dashStyles.statusCell}}>
                      <span style={dashStyles.statusPill(n.status)}>
                        {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                      </span>
                    </td>
                    <td style={{...dashStyles.td, ...dashStyles.supplierCol}} title={td?.supplierName || ""}>{td?.supplierName || ""}</td>
                    <td style={dashStyles.td}>{new Date(n.created_at).toLocaleString()}</td>
                    <td style={dashStyles.td}>{new Date(n.updated_at).toLocaleString()}</td>
                    <td style={{...dashStyles.td, ...dashStyles.openCol}}>
                      <Link to={`/negotiation/${n.id}`}>
                        <button style={dashStyles.openBtn}>Open</button>
                      </Link>
                    </td>
                    <td style={{...dashStyles.td, ...dashStyles.pdfCol}}>
                      <a href={`${API_URL}/api/negotiations/${n.id}/export-pdf`} target="_blank" rel="noopener noreferrer">
                        <button style={dashStyles.pdfBtn}>PDF</button>
                      </a>
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

function StatCard({ label, value, icon, color, green }) {
  return (
    <div style={dashStyles.statCard}>
      <div style={{...dashStyles.statIcon, color}}>{icon}</div>
      <div style={dashStyles.statLabel}>{label}</div>
      <div style={green ? dashStyles.statValueConcluded : dashStyles.statValue}>{value}</div>
    </div>
  );
}
