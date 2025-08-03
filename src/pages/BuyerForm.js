import React, { useState } from "react";
import axios from "axios";

// 👇 Use env variable for backend API
const API_URL = process.env.REACT_APP_API_URL;

const initialTarget = {
  price: "",
  payment_terms: "",
  freight: "",
  delivery_schedule: "",
  warranty: "",
  ld_clause: ""
};

export default function BuyerForm() {
  const [negotiationName, setNegotiationName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [dashboardCode, setDashboardCode] = useState("");
  const [target, setTarget] = useState(initialTarget);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState(null);

  const handleChange = event => {
    setTarget({ ...target, [event.target.name]: event.target.value });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setLink(null);

    try {
      // Use the deployed backend URL
      const res = await axios.post(`${API_URL}/api/negotiations`, {
        name: negotiationName,
        buyer_email: buyerEmail,
        supplier_email: supplierEmail,
        dashboard_code: dashboardCode,
        target_details: target,
      });
      const negotiationId = res.data.id;
      const url = `${window.location.origin}/negotiation/${negotiationId}`;
      setLink(url);
    } catch (err) {
      alert("Error creating negotiation: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="responsive-container" style={{maxWidth: 500, margin:'32px auto', padding: 20, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0002"}}>
      <h2>Start New Negotiation</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Negotiation Name *</label>
          <input value={negotiationName} onChange={e => setNegotiationName(e.target.value)} required />
        </div>
        <div>
          <label>Buyer Email *</label>
          <input value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required />
        </div>
        <div>
          <label>Dashboard Access Code (set a PIN/code) *</label>
          <input
            value={dashboardCode}
            minLength="3"
            maxLength="20"
            onChange={e => setDashboardCode(e.target.value)}
            required
            placeholder="e.g. 1234"
            type="password"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label>Supplier Email (optional)</label>
          <input value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} />
        </div>
        <div>
          <label>Price</label>
          <input name="price" value={target.price} onChange={handleChange} />
        </div>
        <div>
          <label>Payment Terms</label>
          <input name="payment_terms" value={target.payment_terms} onChange={handleChange} />
        </div>
        <div>
          <label>Freight</label>
          <input name="freight" value={target.freight} onChange={handleChange} />
        </div>
        <div>
          <label>Delivery Schedule</label>
          <input name="delivery_schedule" value={target.delivery_schedule} onChange={handleChange} />
        </div>
        <div>
          <label>Warranty</label>
          <input name="warranty" value={target.warranty} onChange={handleChange} />
        </div>
        <div>
          <label>LD Clause</label>
          <input name="ld_clause" value={target.ld_clause} onChange={handleChange} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Start Negotiation"}
        </button>
      </form>
      {link && (
        <div style={{marginTop:16, background: "#eee", padding: 8}}>
          <b>Negotiation Link:</b><br />
          <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
          <div style={{fontSize: 12, marginTop: 6}}>
            You can copy this link and share with the supplier by email or WhatsApp.
          </div>
        </div>
      )}
    </div>
  );
}
