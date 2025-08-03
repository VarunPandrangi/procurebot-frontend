import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";


// Tab header helper
function TabHeader({ tabs, current, onSelect }) {
  return (
    <div style={{
      display: "flex",
      marginBottom: 14,
      borderRadius: 6,
      background: "#f7faff",
      border: "1px solid #e3eefb",
      overflow: "hidden"
    }}>
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onSelect(i)}
          style={{
            flex: 1,
            padding: "10px 0",
            fontWeight: current === i ? "bold" : undefined,
            background: current === i ? "#fff" : "transparent",
            border: "none",
            outline: "none",
            cursor: "pointer"
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export default function NegotiationWizard() {
  const [tab, setTab] = useState(0);

  // Step 1: Basic Info fields
  const [negotiationName, setNegotiationName] = useState("");
  const [company, setCompany] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [dashboardCode, setDashboardCode] = useState("");
  const [currency, setCurrency] = useState("INR (₹)");

  // Step 2/3: Suppliers & Items (+ negotiation terms for each item)
  const blankItem = () => ({
    id: Date.now() + Math.random(),
    name: "",
    quantity: "",
    unit: "",
    description: "",
    targetPrice: "",
    quotedPrice: "",
    paymentTerms: "",
    freightTerms: "",
    deliverySchedule: "",
    warrantyTerms: "",
    ldClause: ""
  });

  const [suppliers, setSuppliers] = useState([
    {
      id: Date.now(),
      name: "",
      email: "",
      representative: "",
      items: [blankItem()]
    }
  ]);
  const tabs = ["Basic Info", "Suppliers & Items", "Negotiation Terms"];

  // Submit/result state
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [created, setCreated] = useState(false);
  const [supplierLinks, setSupplierLinks] = useState([]);

  // Handlers for Suppliers & Items
  const handleSupplierChange = (idx, field, value) => {
    setSuppliers(sups => sups.map(
      (sup, i) => i === idx ? { ...sup, [field]: value } : sup
    ));
  };

  const addSupplier = () => {
    setSuppliers(sups => [
      ...sups,
      {
        id: Date.now() + Math.random(),
        name: "",
        email: "",
        representative: "",
        items: [blankItem()]
      }
    ]);
  };

  const removeSupplier = idx => {
    setSuppliers(sups => sups.filter((_, i) => i !== idx));
  };

  const handleItemChange = (supIdx, itemIdx, field, value) => {
    setSuppliers(sups => sups.map(
      (sup, i) => i === supIdx
        ? { ...sup, items: sup.items.map(
              (item, j) => j === itemIdx ? { ...item, [field]: value } : item
          ) }
        : sup
    ));
  };

  const addItem = supIdx => {
    setSuppliers(sups => sups.map(
      (sup, i) => i === supIdx
        ? { ...sup, items: [...sup.items, blankItem()] }
        : sup
    ));
  };

  const removeItem = (supIdx, itemIdx) => {
    setSuppliers(sups => sups.map(
      (sup, i) => i === supIdx
        ? { ...sup, items: sup.items.filter((_, j) => j !== itemIdx) }
        : sup
    ));
  };

  const handleItemTermChange = (supIdx, itemIdx, field, value) => {
    setSuppliers(sups => sups.map(
      (sup, i) => i === supIdx
        ? { ...sup, items: sup.items.map(
              (item, j) => j === itemIdx ? { ...item, [field]: value } : item
          ) }
        : sup
    ));
  };

  // FINAL SUBMIT - Create Negotiations (one per supplier), then show links
  async function handleSubmitNegotiation() {
    setCreating(true);
    setErrorMsg("");
    try {
      const results = [];
      for (const supplier of suppliers) {
        const res = await axios.post("http://localhost:5000/api/negotiations", {
          name: negotiationName,
          buyer_email: buyerEmail,
          supplier_email: supplier.email,
          dashboard_code: dashboardCode,
          target_details: {
            company,
            buyerName,
            currency,
            supplierName: supplier.name,
            representative: supplier.representative,
            items: supplier.items
          }
        });
        results.push({
          supplierName: supplier.name,
          supplierEmail: supplier.email,
          negotiationId: res.data.id
        });
      }
      // Display links for each supplier
      setSupplierLinks(results.map(r => ({
        supplierName: r.supplierName,
        supplierEmail: r.supplierEmail,
        link: `${window.location.origin}/negotiation/${r.negotiationId}?supplier=${encodeURIComponent(r.supplierEmail)}`
      })));
      setCreated(true);
    } catch (err) {
      setErrorMsg("Error creating negotiation: " + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "32px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 24 }}>
      <h2 style={{ textAlign: "center", marginBottom: 6, fontWeight:700, letterSpacing:0.1 }}>Supplier Negotiation Platform</h2>
      <div style={{ textAlign: "center", color: "#58607c", marginBottom: 16, fontSize:15 }}>
        AI-powered negotiation assistant for optimal supplier terms
      </div>
      <div style={{ fontWeight: "bold", fontSize:17, marginBottom: 7 }}>Create New Negotiation <span style={{
        padding: "2px 7px", background: "#e5ecfe", borderRadius:5, color:"#2040a0", marginLeft:8, fontSize:12
      }}>Beta</span></div>
      <div style={{ color: "#475070", fontSize:13, marginBottom:14 }}>
        Set up your negotiation parameters and generate a secure link for your supplier
      </div>

      {/* Supplier links after creation */}
      {created && (
        <div style={{
          marginTop: 30, background: "#fff", borderRadius: 12, border: "1px solid #eef2f8",
          padding: 22, boxShadow: "0 2px 10px #b9c8d518", minWidth: 320
        }}>
          <h3 style={{ marginBottom: 16, color:"#23326d" }}>Share these links with your suppliers:</h3>
          {supplierLinks.map(linkObj => (
            <div key={linkObj.supplierEmail} style={{
              marginBottom: 14, padding: 10, background: "#f7f8ff", borderRadius: 8
            }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>{linkObj.supplierName} ({linkObj.supplierEmail})</div>
              <div style={{
                fontSize: 14, padding: "7px 0", wordBreak: "break-all", color: "#112590"
              }}>{linkObj.link}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(linkObj.link);
                  alert("Link copied!");
                }}
                style={{
                  marginTop: 3, background: "#3459e6", color: "#fff", border: "none",
                  borderRadius: 5, padding: "6px 13px", fontWeight: 700, cursor: "pointer", fontSize: 14
                }}
              >
                Copy Link
              </button>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <Link to="/dashboard">
              <button style={{
                padding: "8px 28px", borderRadius: 6, fontWeight: 600,
                background: "#333", color: "#fff", border: "none"
              }}>
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* The Wizard - only show if not created */}
      {!created && (
        <>
          {errorMsg && (
            <div style={{
              background: "#ffe7e7",
              color: "#bc2020",
              padding: "8px 12px",
              borderRadius: 6,
              marginBottom: 12,
              fontWeight: 600,
              textAlign: "center"
            }}>
              {errorMsg}
            </div>
          )}

          {tab === 0 &&
            <div style={{ marginTop: 8 }}>
              <div style={{ display:"flex", gap:18, marginBottom:12 }}>
                <div style={{flex:1}}>
                  <div style={{ fontWeight:500, marginBottom:4 }}>Negotiation Name</div>
                  <input
                    value={negotiationName}
                    onChange={e => setNegotiationName(e.target.value)}
                    placeholder="e.g., Q4 2024 Component Procurement"
                    style={{ width: "100%", padding: 8, borderRadius: 5, border:"1px solid #d6dbe9"}}
                    required
                  />
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontWeight:500, marginBottom:4 }}>Buyer Name</div>
                  <input
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="e.g., John Smith"
                    style={{ width: "100%", padding: 8, borderRadius: 5, border:"1px solid #d6dbe9"}}
                    required
                  />
                </div>
              </div>
              <div style={{ display:"flex", gap:18, marginBottom:12 }}>
                <div style={{flex:1}}>
                  <div style={{ fontWeight:500, marginBottom:4 }}>Buyer Email</div>
                  <input
                    value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)}
                    placeholder="e.g., buyer@email.com"
                    style={{ width: "100%", padding: 8, borderRadius: 5, border:"1px solid #d6dbe9"}}
                    required
                    type="email"
                  />
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontWeight:500, marginBottom:4 }}>Dashboard Access Code (set a PIN/code)</div>
                  <input
                    value={dashboardCode}
                    onChange={e => setDashboardCode(e.target.value)}
                    placeholder="e.g. 1234"
                    style={{ width: "100%", padding: 8, borderRadius: 5, border:"1px solid #d6dbe9"}}
                    required
                    minLength={3}
                    maxLength={20}
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div style={{ display:"flex", gap:18 }}>
                <div style={{flex:1}}>
                  <div style={{ fontWeight:500, marginBottom:4 }}>Company Name</div>
                  <input
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Enter your company name"
                    style={{ width: "100%", padding: 8, borderRadius: 5, border:"1px solid #d6dbe9"}}
                    required
                  />
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontWeight:500, marginBottom:4 }}>Currency</div>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    style={{ width:"100%", padding:8, borderRadius:5, border:"1px solid #d6dbe9"}}
                    required
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => setTab(1)}
                  disabled={!negotiationName || !company || !buyerName || !buyerEmail || !dashboardCode}
                  style={{
                    background: "#444b5f",
                    color: "#fff",
                    fontWeight: 600,
                    padding: "10px 30px",
                    border: "none",
                    borderRadius: 5,
                    marginTop: 12,
                    cursor: !negotiationName || !company || !buyerName || !buyerEmail || !dashboardCode ? "not-allowed" : "pointer"
                  }}
                >
                  Next: Suppliers & Items
                </button>
              </div>
            </div>
          }

          {tab === 1 &&
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>Suppliers & Items</div>
              {suppliers.map((sup, supIdx) => (
                <div key={sup.id} style={{
                  border: "1px solid #dae4f3",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 26,
                  background: "#fafdff",
                }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 8 }}>
                    <div style={{fontWeight:600, fontSize:15}}>Supplier {supIdx+1}</div>
                    {suppliers.length > 1 && (
                      <button
                        onClick={() => removeSupplier(supIdx)} style={{
                          background: "#f25b5b", color: "#fff",
                          border: "none", borderRadius: 3, padding: "2px 10px", cursor: "pointer", fontWeight: 700, fontSize: 12
                        }}
                      >Remove</button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div className="input-label">Supplier Name</div>
                      <input
                        value={sup.name}
                        onChange={e => handleSupplierChange(supIdx, "name", e.target.value)}
                        placeholder="e.g. ABC Supplier Ltd."
                        style={{ width: "100%", padding: 7, borderRadius: 4, border:"1px solid #ccd7ee"}}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="input-label">Supplier Email</div>
                      <input
                        value={sup.email}
                        onChange={e => handleSupplierChange(supIdx, "email", e.target.value)}
                        placeholder="supplier@company.com"
                        style={{ width: "100%", padding: 7, borderRadius: 4, border:"1px solid #ccd7ee"}}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="input-label">Representative Name</div>
                      <input
                        value={sup.representative}
                        onChange={e => handleSupplierChange(supIdx, "representative", e.target.value)}
                        placeholder="e.g. Jane Doe"
                        style={{ width: "100%", padding: 7, borderRadius: 4, border:"1px solid #ccd7ee"}}
                      />
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom:7, fontWeight:500 }}>Items</div>
                    {sup.items.map((item, itemIdx) => (
                      <div key={item.id} style={{
                        border: "1px solid #e6edf7", borderRadius: 6, marginBottom: 12, padding: 8, background: "#f4f8fb"
                      }}>
                        <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:5}}>
                          <div style={{flex:2}}>
                            <input
                              value={item.name}
                              onChange={e => handleItemChange(supIdx, itemIdx, "name", e.target.value)}
                              placeholder="Item Name"
                              style={{ width: "100%", padding:6, borderRadius:4, border:"1px solid #ccd7ee"}}
                            />
                          </div>
                          <div style={{flex:1}}>
                            <input
                              value={item.quantity}
                              onChange={e => handleItemChange(supIdx, itemIdx, "quantity", e.target.value)}
                              placeholder="Quantity"
                              style={{ width: "100%", padding:6, borderRadius:4, border:"1px solid #ccd7ee"}}
                            />
                          </div>
                          <div style={{flex:1}}>
                            <input
                              value={item.unit}
                              onChange={e => handleItemChange(supIdx, itemIdx, "unit", e.target.value)}
                              placeholder="Unit"
                              style={{ width: "100%", padding:6, borderRadius:4, border:"1px solid #ccd7ee"}}
                            />
                          </div>
                          {sup.items.length > 1 && (
                            <button
                              onClick={() => removeItem(supIdx, itemIdx)}
                              style={{
                                background: "#f25b5b", color: "#fff", border: "none",
                                borderRadius: 3, padding: "2px 9px", marginLeft: 6,
                                fontWeight: 700, fontSize:12, cursor: "pointer"
                              }}
                            >Remove</button>
                          )}
                        </div>
                        <div>
                          <textarea
                            value={item.description}
                            onChange={e => handleItemChange(supIdx, itemIdx, "description", e.target.value)}
                            placeholder="Description"
                            style={{ width: "100%", borderRadius: 4, padding: 6, minHeight: 32, border:"1px solid #ccd7ee", fontFamily:"inherit"}}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem(supIdx)}
                      style={{
                        marginTop: 4, background: "#cde6ff", color: "#24477b",
                        border: "none", padding:"5px 16px", borderRadius:4, fontWeight:700, cursor: "pointer"
                      }}
                    >+ Add Item</button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addSupplier}
                style={{
                  background: "#e5ecfe", color:"#2255a5", border:"none",
                  padding:"7px 22px", borderRadius:5, fontWeight:700, fontSize:15,
                  marginBottom:20, cursor:"pointer"
                }}>
                + Add Supplier
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop:16 }}>
                <button
                  type="button"
                  onClick={() => setTab(0)}
                  style={{
                    background: "#eee", color:"#222", border:"none",
                    borderRadius:5, padding:"9px 24px",
                    fontWeight:600, cursor:"pointer"
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setTab(2)}
                  style={{
                    background: "#444b5f", color:"#fff", border:"none",
                    borderRadius:5, padding:"9px 28px", fontWeight:600, cursor:"pointer"
                  }}
                  disabled={suppliers.some(sup => !sup.name || !sup.email || !sup.items[0].name)}
                >
                  Next: Negotiation Terms
                </button>
              </div>
            </div>
          }

          {tab === 2 &&
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>Negotiation Terms</div>
              {suppliers.map((sup, supIdx) => (
                <div key={sup.id} style={{
                  border: "1px solid #dae4f3",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 26,
                  background: "#fafbfc"
                }}>
                  <div style={{fontWeight:600, fontSize:15, marginBottom:8}}>Supplier {supIdx+1} - {sup.name || "Name?"}</div>
                  {sup.items.map((item, itemIdx) => (
                    <div key={item.id} style={{
                      border: "1px solid #e6edf7", borderRadius: 6, marginBottom: 14, padding: 10, background: "#f7faff"
                    }}>
                      <div style={{fontWeight:500, marginBottom:4}}>Item {itemIdx+1}: {item.name || "Name?"}</div>
                      <div style={{display:"flex", gap:10, marginBottom:8}}>
                        <input
                          value={item.targetPrice}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "targetPrice", e.target.value)}
                          placeholder="Target Price"
                          style={{ flex: 1, padding: 6, borderRadius: 4, border:"1px solid #ccd7ee"}}
                        />
                        <input
                          value={item.quotedPrice}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "quotedPrice", e.target.value)}
                          placeholder="Quoted Price"
                          style={{ flex: 1, padding: 6, borderRadius: 4, border:"1px solid #ccd7ee"}}
                        />
                      </div>
                      <div style={{display:"flex", gap:10, marginBottom:8}}>
                        <input
                          value={item.paymentTerms}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "paymentTerms", e.target.value)}
                          placeholder="Payment Terms"
                          style={{ flex: 1, padding: 6, borderRadius: 4, border:"1px solid #ccd7ee"}}
                        />
                        <input
                          value={item.freightTerms}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "freightTerms", e.target.value)}
                          placeholder="Freight Terms"
                          style={{ flex: 1, padding: 6, borderRadius: 4, border:"1px solid #ccd7ee"}}
                        />
                      </div>
                      <div style={{display:"flex", gap:10, marginBottom:8}}>
                        <input
                          value={item.deliverySchedule}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "deliverySchedule", e.target.value)}
                          placeholder="Delivery Schedule"
                          style={{ flex: 1, padding: 6, borderRadius: 4, border:"1px solid #ccd7ee"}}
                        />
                        <input
                          value={item.warrantyTerms}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "warrantyTerms", e.target.value)}
                          placeholder="Warranty Terms"
                          style={{ flex: 1, padding: 6, borderRadius: 4, border:"1px solid #ccd7ee"}}
                        />
                      </div>
                      <div style={{marginBottom: 8}}>
                        <input
                          value={item.ldClause}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "ldClause", e.target.value)}
                          placeholder="LD Clause (Penalty)"
                          style={{ width: "100%", padding: 6, borderRadius: 4, border:"1px solid #ccd7ee"}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setTab(1)}
                  style={{
                    background: "#eee", color:"#222", border:"none",
                    borderRadius:5, padding:"9px 24px",
                    fontWeight:600, cursor:"pointer"
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={
                    creating ||
                    suppliers.some(sup =>
                      sup.items.some(item =>
                        !item.targetPrice || !item.paymentTerms || !item.deliverySchedule
                      )
                    )
                  }
                  style={{
                    background: "#3459e6",
                    color:"#fff",
                    border:"none",
                    borderRadius:5,
                    padding:"9px 28px",
                    fontWeight:600, cursor:"pointer", opacity: 1
                  }}
                  onClick={handleSubmitNegotiation}
                >
                  {creating ? "Creating..." : "Start Negotiation"}
                </button>
              </div>
            </div>
          }

          <div style={{marginTop:16, textAlign:"center", fontSize:12, color:"#888"}}>
            Step {tab+1} of {tabs.length}
          </div>
        </>
      )}
    </div>
  );
}
