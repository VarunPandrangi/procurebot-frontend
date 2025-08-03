import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

// --- Modern Compact Chat Styles ---
const chatStyles = {
  container: {
    maxWidth: 650,
    margin: "45px auto",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 8px 32px #2e467017",
    padding: "30px 24px 14px 24px",
    fontFamily: "Inter,Helvetica,Arial,sans-serif",
  },
  titleRow: { fontWeight:700, fontSize:25, letterSpacing:-0.1, color:"#21295e", marginBottom:0 },
  subRow: {marginBottom: 30, marginTop: 12, display:"flex", alignItems:"center", gap:16, fontSize:16},
  statusChip: {
    display: "inline-block",
    padding: "5px 18px",
    borderRadius: 15,
    fontWeight: 700,
    fontSize: 15,
    marginRight: 7
  },
  supplierSub: {fontWeight:500, color:"#353b3d", fontSize:16, marginLeft: 0},
  downloadBtn: {
    background: "#2468f7", color: "#fff", fontWeight: 700,
    border: "none", borderRadius: 9, padding: "12px 26px",
    cursor: "pointer", fontSize: 15, marginBottom: 24, marginTop:2, letterSpacing:0.08
  },
  chatArea: {
    margin: "0 0 15px 0",
    background: "#f4f8ff",
    minHeight: 320,
    maxHeight: 440,
    width: "100%",
    borderRadius: 16,
    padding: "18px 12px 13px 12px",
    scrollBehavior: "smooth",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  chatMsgRow: {display: "flex"},
  aiBubble: {
    maxWidth: "70%",
    background: "#eef1f6",
    color: "#1b2338",
    borderRadius: "14px 14px 14px 7px",
    alignSelf: "flex-start",
    marginRight: "auto",
    padding: "14px 18px 11px 13px",
    fontWeight: 500,
    lineHeight: 1.53,
    fontSize:15,
    boxShadow:"0 2px 12px #658afe11"
  },
  supplierBubble: {
    maxWidth: "70%",
    background: "#1f6fff",
    color: "#fff",
    borderRadius: "12px 16px 9px 14px",
    alignSelf: "flex-end",
    marginLeft: "auto",
    padding: "14px 16px 11px 13px",
    fontWeight: 500,
    lineHeight: 1.53,
    fontSize:15,
    boxShadow:"0 2px 18px #2e74ff0d"
  },
  senderLabel: { fontWeight: 800, fontSize: 17, marginBottom: 7, color: "#06247c" },
  senderSupplier: { fontWeight: 800, fontSize: 17, marginBottom: 7, color: "#fff" },
  chatTimestamp: { fontSize:12, color:"#6e7896", margin: "8px 0 0 3px", fontWeight:500 }
};

async function fetchNegotiation(id) {
  const res = await axios.get(`${SOCKET_URL}/api/negotiations/${id}`);
  return res.data;
}

// Clean AI message: remove markdown, pretty line breaks
function formatMessage(text) {
  if (!text) return "";
  let clean = text.replace(/[\*#]+/g, "");
  clean = clean.replace(/\n{2,}/g, "___PARA___");
  clean = clean.replace(/([^\n])\n([^\n-•0-9])/g, "$1 $2");
  clean = clean.replace(/([^\n])\n([A-Za-z])/g, "$1 $2");
  clean = clean.replace(/___PARA___/g, "\n\n");
  clean = clean.replace(/(\n|^)(\d+\.)/g, "\n$2");
  clean = clean.replace(/(\n|^)- /g, "\n- ");
  return clean.trim();
}

export default function NegotiationChat() {
  const { negotiationId } = useParams();
  const [negotiation, setNegotiation] = useState(null);
  const [userType, setUserType] = useState(""); // 'buyer' or 'supplier'
  const [messageText, setMessageText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [concluded, setConcluded] = useState(false);
  const [aiGreetingSent, setAIGreetingSent] = useState(false);
  const messagesEndRef = useRef();
  const socketRef = useRef();

  useEffect(() => {
    fetchNegotiation(negotiationId).then(data => {
      setNegotiation(data);
      setChatHistory(data.chat_history || []);
      if (data.status === "concluded") setConcluded(true);

      // ---- AI bot: auto-send first message if no chat yet and not already sent one ----
      if (!aiGreetingSent && (data.chat_history || []).length === 0) {
        // Prepare breakdown of targets and terms
        const items = data.target_details?.items || [];
        let itemLines = [];
        for (let item of items) {
          itemLines.push(
            `• Item: ${item.name || "(unspecified)"}\n` +
            `  Target price: ${item.targetPrice || "-"}${item.currency ? " " + item.currency : ""}\n` +
            `  Quoted price: ${item.quotedPrice || "-"}${item.currency ? " " + item.currency : ""}\n` +
            `  Target terms: ${item.paymentTerms || "-"}, ${item.freightTerms || "-"}, ${item.warrantyTerms || "-"}`
          );
        }
        const breakdown = itemLines.length > 0 ? `\n\n${itemLines.join("\n\n")}` : "";

        const autoMessage = {
          sender: "buyer",
          text: `Thank you for your proposal on the subject. We have thoroughly reviewed the proposal and would like to request you to consider our targets and the following:${breakdown}`,
          timestamp: new Date().toISOString(),
        };
        setAIGreetingSent(true); // Prevent repeat sends!
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.emit("chatMessage", {
              negotiationId: data.id,
              messageObj: autoMessage,
            });
          }
        }, 400);
      }
    });
    // eslint-disable-next-line
  }, [negotiationId, aiGreetingSent]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit("joinNegotiation", {
      negotiationId,
      userType: userType || "guest"
    });
    socket.on("chatMessage", msg => {
      setChatHistory(prev => [...prev, msg]);
    });
    socket.on("negotiationConcluded", ({ closer, time }) => {
      setConcluded(true);
      setChatHistory(prev => [
        ...prev,
        {
          sender: "system",
          text: `Negotiation concluded by ${closer} at ${new Date(time).toLocaleString()}`,
          timestamp: time
        }
      ]);
    });
    return () => socket.disconnect();
    // eslint-disable-next-line
  }, [negotiationId, userType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const sendMessage = () => {
    if (!messageText.trim() || concluded) return;
    const msgObj = {
      sender: userType,
      text: messageText,
      timestamp: new Date().toISOString()
    };
    socketRef.current.emit("chatMessage", {
      negotiationId, messageObj: msgObj
    });
    setMessageText(""); // do NOT update chatHistory here!
  };

  const conclude = () => {
    if (concluded) return;
    socketRef.current.emit("concludeNegotiation", {
      negotiationId,
      closer: userType
    });
  };

  const downloadPDF = () => {
    const url = `http://localhost:5000/api/negotiations/${negotiationId}/export-pdf`;
    window.open(url, "_blank");
  };

  if (!negotiation)
    return <div>Loading negotiation...</div>;

  const supplierName = negotiation.target_details?.supplierName || "";
  const buyerName = negotiation.target_details?.buyerName || "AI Bot";
  const isConcluded = negotiation.status === "concluded" || concluded;

  return (
    <div style={chatStyles.container}>
      {/* Title Section */}
      <div style={chatStyles.titleRow}>
        {negotiation.name}
        {supplierName &&
          <span style={{fontWeight:400, fontSize:22, color:"#757b90", marginLeft:8}}>
            {"— "}{supplierName}
          </span>
        }
      </div>
      <div style={chatStyles.subRow}>
        <span style={{
          ...chatStyles.statusChip,
          background: isConcluded
            ? "linear-gradient(90deg,#fae2e2 70%,#ff5b5b 100%)"
            : "linear-gradient(90deg,#e0faef 60%,#6ee4a6 100%)",
          color: isConcluded ? "#bc1720" : "#188a42"
        }}>
          {isConcluded ? "Concluded" : "Active"}
        </span>
        <span style={chatStyles.supplierSub}>
          Supplier: <b>{supplierName}</b>
        </span>
      </div>
      <button
        onClick={downloadPDF}
        style={chatStyles.downloadBtn}
      >
        <span style={{fontSize:17, marginRight:10}}>⬇️</span>
        Download Full Negotiation as PDF
      </button>

      {/* UserType Picker */}
      {!userType && (
        <div style={{ marginBottom: 16 }}>
          <label style={{fontSize:15, fontWeight:500}}>Who are you? </label>
          <select onChange={e => setUserType(e.target.value)} value={userType} style={{fontSize:14, padding:"4px 11px", borderRadius:6}}>
            <option value="">Select</option>
            <option value="buyer">Buyer</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>
      )}

      {/* --- Chat Bubble Area --- */}
      <div style={chatStyles.chatArea}>
        {chatHistory.map((msg, idx) => {
          const isSupplier = msg.sender === "supplier";
          let bubbleStyle = isSupplier ? chatStyles.supplierBubble : chatStyles.aiBubble;
          let alignStyle = {justifyContent: isSupplier ? "flex-end" : "flex-start"};
          let lab = isSupplier
            ? `Supplier: ${supplierName || "Supplier"}`
            : `${buyerName || "AI Bot"} - AI Bot`;
          let labelStyle = isSupplier ? chatStyles.senderSupplier : chatStyles.senderLabel;
          return (
            <div key={idx} style={{ ...chatStyles.chatMsgRow, ...alignStyle }}>
              <div style={bubbleStyle}>
                <div style={labelStyle}>{lab}</div>
                <div style={{whiteSpace:"pre-line", wordBreak:"break-word"}}>
                  {formatMessage(msg.text)}
                </div>
                <div style={chatStyles.chatTimestamp}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Chat Input Bar --- */}
      {!concluded && userType && (
        <div style={{ display: "flex", gap: 11, marginTop: 13, alignItems:"center" }}>
          <input
            style={{
              flex: 1,
              fontSize: 15,
              padding: "13px 13px",
              borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              marginRight: 6,
              outline: "none",
              boxShadow: "0 0.5px 0 #f5f8fb"
            }}
            disabled={!userType}
            placeholder="Type a message..."
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            style={{
              background: "#2468f7", color:"#fff", fontWeight:700, fontSize:15,
              border: "none", borderRadius: 8, padding: "12px 19px", cursor:"pointer",
              marginRight: 6
            }}
            onClick={sendMessage}
            disabled={!userType || !messageText.trim()}
          >
            Send
          </button>
          <button
            onClick={conclude}
            style={{
              background: "#ef314d",
              color: "#fff",
              borderRadius: 10,
              padding: "12px 17px",
              fontWeight: 800,
              fontSize: 15,
              border: "none",
              marginLeft: 4
            }}
          >
            Conclude Negotiation
          </button>
        </div>
      )}
      {concluded && (
        <div style={{
          marginTop: 15,
          color: "#c00",
          fontWeight: "bold",
          fontSize: 17
        }}>
          Negotiation has ended.
        </div>
      )}
    </div>
  );
}
