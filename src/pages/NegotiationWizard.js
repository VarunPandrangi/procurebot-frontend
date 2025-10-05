import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./NegotiationWizard.css";

// 👇 Use env variable for backend API
const API_URL = process.env.REACT_APP_API_URL;

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
    ldClause: "",
    context: ""      // 🟢 <-- New context field here!
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
        // 👇 Use API_URL here
        const res = await axios.post(`${API_URL}/api/negotiations`, {
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
            items: supplier.items // 🟢 "context" will be included for each item!
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
    <div className="wizard-container">
      <h2 className="wizard-title">Supplier Negotiation Platform</h2>
      <div className="wizard-subtitle">
        AI-powered negotiation assistant for optimal supplier terms
      </div>
      <div className="wizard-section-title">
        Create New Negotiation 
        <span className="beta-badge">Beta</span>
      </div>
      <div className="wizard-section-subtitle">
        Set up your negotiation parameters and generate a secure link for your supplier
      </div>

      {/* Supplier links after creation */}
      {created && (
        <div className="supplier-links-card">
          <h3 className="supplier-links-title">Share these links with your suppliers:</h3>
          {supplierLinks.map(linkObj => (
            <div key={linkObj.supplierEmail} className="supplier-link-item">
              <div className="supplier-email">{linkObj.supplierName} ({linkObj.supplierEmail})</div>
              <div className="link-display">
                <div className="link-text">{linkObj.link}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(linkObj.link);
                    alert("Link copied!");
                  }}
                  className="copy-btn"
                >
                  Copy Link
                </button>
              </div>
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

          {/* Step 0 */}
          {tab === 0 &&
            <div style={{ marginTop: 8 }}>
              <div className="initial-form-grid">
                <div className="form-two-column">
                  <div className="form-field">
                    <label className="form-field-label">Negotiation Name</label>
                    <input
                      className="form-input"
                      value={negotiationName}
                      onChange={e => setNegotiationName(e.target.value)}
                      placeholder="e.g., Q4 2024 Component Procurement"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-field-label">Buyer Name</label>
                    <input
                      className="form-input"
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      placeholder="e.g., John Smith"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-two-column">
                  <div className="form-field">
                    <label className="form-field-label">Buyer Email</label>
                    <input
                      className="form-input"
                      value={buyerEmail}
                      onChange={e => setBuyerEmail(e.target.value)}
                      placeholder="e.g., buyer@email.com"
                      required
                      type="email"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-field-label">Dashboard Access Code (set a PIN/code)</label>
                    <input
                      className="form-input"
                      value={dashboardCode}
                      onChange={e => setDashboardCode(e.target.value)}
                      placeholder="e.g. 1234"
                      required
                      minLength={3}
                      maxLength={20}
                      type="password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                
                <div className="form-two-column">
                  <div className="form-field">
                    <label className="form-field-label">Company Name</label>
                    <input
                      className="form-input"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="Enter your company name"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-field-label">Currency</label>
                    <select
                      className="form-select"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      required
                    >
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="USD ($)">USD ($)</option>
                      <option value="EUR (€)">EUR (€)</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setTab(1)}
                  disabled={!negotiationName || !company || !buyerName || !buyerEmail || !dashboardCode}
                  className="initial-form-submit"
                >
                  Next: Suppliers & Items
                </button>
              </div>
            </div>
          }

          {/* Step 1 */}
          {tab === 1 &&
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>Suppliers & Items</div>
              {suppliers.map((sup, supIdx) => (
                <div key={sup.id} className="supplier-card">
                  <div className="supplier-card-header">
                    <div className="supplier-card-title">Supplier {supIdx+1}</div>
                    {suppliers.length > 1 && (
                      <button
                        onClick={() => removeSupplier(supIdx)}
                        className="remove-supplier-btn"
                      >
                        <span>✕</span> Remove Supplier
                      </button>
                    )}
                  </div>
                  <div className="supplier-info-grid">
                    <input
                      className="supplier-info-input"
                      value={sup.name}
                      onChange={e => handleSupplierChange(supIdx, "name", e.target.value)}
                      placeholder="e.g. ABC Supplier Ltd."
                    />
                    <input
                      className="supplier-info-input"
                      value={sup.email}
                      onChange={e => handleSupplierChange(supIdx, "email", e.target.value)}
                      placeholder="supplier@company.com"
                      type="email"
                    />
                    <input
                      className="supplier-info-input"
                      value={sup.representative}
                      onChange={e => handleSupplierChange(supIdx, "representative", e.target.value)}
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div className="item-section-header">
                    <div className="item-section-title">Items</div>
                  </div>
                  {sup.items.map((item, itemIdx) => (
                    <div key={item.id} className="item-card">
                      <div className="item-card-header">
                        <span className="item-card-label">Item {itemIdx + 1}</span>
                        {sup.items.length > 1 && (
                          <button
                            onClick={() => removeItem(supIdx, itemIdx)}
                            className="remove-item-btn"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="item-input-grid">
                        <div className="item-input-row">
                          <input
                            className="item-input"
                            value={item.name}
                            onChange={e => handleItemChange(supIdx, itemIdx, "name", e.target.value)}
                            placeholder="Item Name"
                          />
                          <input
                            className="item-input"
                            value={item.quantity}
                            onChange={e => handleItemChange(supIdx, itemIdx, "quantity", e.target.value)}
                            placeholder="Quantity"
                          />
                          <input
                            className="item-input"
                            value={item.unit}
                            onChange={e => handleItemChange(supIdx, itemIdx, "unit", e.target.value)}
                            placeholder="Unit"
                          />
                        </div>
                        <textarea
                          className="item-input item-description"
                          value={item.description}
                          onChange={e => handleItemChange(supIdx, itemIdx, "description", e.target.value)}
                          placeholder="Description"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addItem(supIdx)}
                    className="add-item-btn"
                  >
                    Add Item
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSupplier}
                className="add-supplier-btn"
              >
                Add Supplier
              </button>

              <div className="wizard-nav-container">
                <button
                  type="button"
                  onClick={() => setTab(0)}
                  className="wizard-back-btn"
                >
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab(2)}
                  className="wizard-next-btn"
                  disabled={suppliers.some(sup => !sup.name || !sup.email || !sup.items[0].name)}
                >
                  <span>Next: Negotiation Terms</span>
                </button>
              </div>
            </div>
          }

          {/* Step 2 */}
          {tab === 2 &&
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>Negotiation Terms</div>
              {suppliers.map((sup, supIdx) => (
                <div key={sup.id} className="supplier-card">
                  <div className="supplier-card-header">
                    <div className="supplier-card-title">Supplier {supIdx+1} - {sup.name || "Name?"}</div>
                  </div>
                  {sup.items.map((item, itemIdx) => (
                    <div key={item.id} className="item-card">
                      <div className="item-card-header">
                        <span className="item-card-label">Item {itemIdx+1}: {item.name || "Name?"}</span>
                      </div>
                      <div className="terms-input-grid">
                        <input
                          className="item-input"
                          value={item.targetPrice}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "targetPrice", e.target.value)}
                          placeholder="Target Price"
                        />
                        <input
                          className="item-input"
                          value={item.quotedPrice}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "quotedPrice", e.target.value)}
                          placeholder="Quoted Price"
                        />
                        <input
                          className="item-input"
                          value={item.paymentTerms}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "paymentTerms", e.target.value)}
                          placeholder="Payment Terms"
                        />
                        <input
                          className="item-input"
                          value={item.freightTerms}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "freightTerms", e.target.value)}
                          placeholder="Freight Terms"
                        />
                        <input
                          className="item-input"
                          value={item.deliverySchedule}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "deliverySchedule", e.target.value)}
                          placeholder="Delivery Schedule"
                        />
                        <input
                          className="item-input"
                          value={item.warrantyTerms}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "warrantyTerms", e.target.value)}
                          placeholder="Warranty Terms"
                        />
                        <input
                          className="item-input terms-input-full"
                          value={item.ldClause}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "ldClause", e.target.value)}
                          placeholder="LD Clause (Penalty)"
                        />
                        <textarea
                          className="item-input item-description terms-input-full"
                          value={item.context}
                          onChange={e => handleItemTermChange(supIdx, itemIdx, "context", e.target.value)}
                          placeholder="E.g. Be strict on price, flexible on delivery; reference previous orders, mention market trends, use split-difference, escalate after 2 rounds, etc."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="wizard-nav-container">
                <button
                  type="button"
                  onClick={() => setTab(1)}
                  className="wizard-back-btn"
                >
                  <span>Back</span>
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
                  className="wizard-next-btn"
                  onClick={handleSubmitNegotiation}
                >
                  <span>{creating ? "Creating..." : "Start Negotiation"}</span>
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
