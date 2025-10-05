import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./NegotiationChat.css";

// Use env variable for backend
const API_URL = process.env.REACT_APP_API_URL;
const SOCKET_URL = API_URL; // Works if you use same backend for socket and API

// Debug: Log the API URL being used
console.log('🔧 API_URL:', API_URL);
console.log('🔧 SOCKET_URL:', SOCKET_URL);

async function fetchNegotiation(id) {
  const res = await axios.get(`${API_URL}/api/negotiations/${id}`);
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
  const [socketConnected, setSocketConnected] = useState(false);
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
    // 👇 Use SOCKET_URL env variable for sockets with proper configuration!
    const socket = io(SOCKET_URL, { 
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setSocketConnected(true);
      socket.emit("joinNegotiation", {
        negotiationId,
        userType: userType || "guest"
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });
    
    socket.on("chatMessage", msg => {
      console.log('Received chat message:', msg);
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
    
    return () => {
      console.log('Disconnecting socket');
      socket.disconnect();
    };
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
    const url = `${API_URL}/api/negotiations/${negotiationId}/export-pdf`;
    window.open(url, "_blank");
  };

  if (!negotiation)
    return <div className="responsive-container">Loading negotiation...</div>;

  const supplierName = negotiation.target_details?.supplierName || "";
  const buyerName = negotiation.target_details?.buyerName || "AI Bot";
  const isConcluded = negotiation.status === "concluded" || concluded;

  return (
    <div className="chat-container">
      {/* Connection Status Indicator */}
      <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
        {socketConnected ? "🟢 Connected" : "🔴 Disconnected"} 
        {!API_URL && " | ⚠️ API_URL not set!"}
        {API_URL && ` | Backend: ${API_URL}`}
        {` | Messages in chat: ${chatHistory.length}`}
      </div>
      
      {/* Title Section */}
      <h1 className="chat-title">
        {negotiation.name}
        {supplierName && (
          <span className="chat-supplier-name">— {supplierName}</span>
        )}
      </h1>
      
      <div className="chat-subtitle">
        <span className={`status-chip ${isConcluded ? 'concluded' : 'active'}`}>
          {isConcluded ? "Concluded" : "Active"}
        </span>
        <span className="supplier-info">
          Supplier: <b>{supplierName}</b>
        </span>
      </div>
      
      <button onClick={downloadPDF} className="download-btn">
        <span style={{fontSize:17}}>⬇️</span>
        Download Full Negotiation as PDF
      </button>

      {/* UserType Picker */}
      {!userType && (
        <div className="user-type-selector">
          <label className="user-type-label">
            ⚠️ Please select who you are to start chatting: 
          </label>
          <select 
            onChange={e => setUserType(e.target.value)} 
            value={userType} 
            className="user-type-select"
          >
            <option value="">-- Select Your Role --</option>
            <option value="buyer">Buyer</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>
      )}

      {/* Chat Bubble Area */}
      <div className="chat-messages">
        {chatHistory.map((msg, idx) => {
          const isSupplier = msg.sender === "supplier";
          const senderLabel = isSupplier
            ? `Supplier: ${supplierName || "Supplier"}`
            : `${buyerName || "AI Bot"} - AI Bot`;
          
          return (
            <div key={idx} className="message-row" style={{justifyContent: isSupplier ? "flex-end" : "flex-start"}}>
              <div className={`message-bubble ${isSupplier ? 'supplier' : 'ai'}`}>
                <div className="message-sender">{senderLabel}</div>
                <div className="message-text">
                  {formatMessage(msg.text)}
                </div>
                <div className="message-timestamp">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      {!concluded && userType && (
        <div className="chat-input-container">
          <input
            className="chat-input"
            disabled={!userType}
            placeholder="Type a message..."
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!userType || !messageText.trim()}
          >
            Send
          </button>
          <button onClick={conclude} className="chat-conclude-btn">
            Conclude Negotiation
          </button>
        </div>
      )}
      
      {concluded && (
        <div className="concluded-message">
          Negotiation has ended.
        </div>
      )}
    </div>
  );
}
